import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { runTeam } from "@/lib/agents/graph";
import { z } from "zod";

const TriggerSchema = z.object({
  goal: z.string().min(10, "Goal must be at least 10 characters").max(1000),
  llmConfig: z
    .object({ provider: z.string(), model: z.string() })
    .optional(),
});

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  // Verify auth via bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate request body
  const body = await request.json();
  const parsed = TriggerSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create goal record
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .insert({ user_id: user.id, title: parsed.data.goal, status: "running" })
    .select()
    .single();

  if (goalError || !goal) {
    return new Response(
      JSON.stringify({ error: "Failed to create goal" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Stream agent output via SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const msg of runTeam(parsed.data.goal)) {
          // Persist message to Supabase
          await supabase.from("messages").insert({
            goal_id: goal.id,
            user_id: user.id,
            agent_name: msg.agent,
            content: msg.content,
            metadata: { node: msg.node },
          });

          // Send SSE event
          const event = `data: ${JSON.stringify(msg)}\n\n`;
          controller.enqueue(encoder.encode(event));
        }

        // Mark goal complete
        await supabase
          .from("goals")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", goal.id);

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", goal_id: goal.id })}\n\n`));
        controller.close();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";

        // Mark goal failed
        await supabase
          .from("goals")
          .update({ status: "failed", result: { error: errorMsg } })
          .eq("id", goal.id);

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

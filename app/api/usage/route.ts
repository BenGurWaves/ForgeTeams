import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  // Aggregate usage for the current user
  const { data: usage } = await supabase
    .from("usage")
    .select("tokens_in, tokens_out, model, provider, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const totals = (usage || []).reduce(
    (acc, row) => ({
      tokens_in: acc.tokens_in + row.tokens_in,
      tokens_out: acc.tokens_out + row.tokens_out,
      requests: acc.requests + 1,
    }),
    { tokens_in: 0, tokens_out: 0, requests: 0 }
  );

  return Response.json({ totals, recent: usage || [] });
}

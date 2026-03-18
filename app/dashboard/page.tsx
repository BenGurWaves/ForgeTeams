"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";

interface AgentMessage {
  agent: string;
  content: string;
  timestamp: string;
  node?: string;
}

const agentColors: Record<string, string> = {
  supervisor: "text-accent",
  planner: "text-blue-400",
  researcher: "text-emerald-400",
  executor: "text-orange-400",
  reviewer: "text-purple-400",
};

export default function DashboardPage() {
  const [goal, setGoal] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ email: data.user.email || "" });
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim() || isRunning) return;

    setIsRunning(true);
    setMessages([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessages([{
          agent: "system",
          content: "Not authenticated. Please sign in.",
          timestamp: new Date().toISOString(),
        }]);
        setIsRunning(false);
        return;
      }

      const response = await fetch("/api/trigger-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ goal }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "done" || data.type === "error") continue;
              setMessages((prev) => [...prev, data]);
            } catch {
              // Skip malformed SSE
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          agent: "system",
          content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  }

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-primary/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-heading text-lg font-medium tracking-tight">
            ForgeTeams
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/settings" className="text-text-secondary hover:text-text-primary transition-colors">
              Settings
            </Link>
            {user ? (
              <span className="text-text-secondary">{user.email}</span>
            ) : (
              <button
                onClick={handleSignIn}
                className="bg-accent text-bg-primary px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Goal Input */}
        <div className="mb-12">
          <h1 className="font-heading text-2xl font-bold mb-2">Mission Control</h1>
          <p className="text-text-secondary text-sm mb-8">
            Describe your goal. Your team of five agents will handle the rest.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Grow my Shopify revenue 30% this quarter..."
              rows={3}
              className="w-full bg-bg-secondary border border-border px-4 py-3 text-text-primary placeholder-text-secondary/50 text-sm focus:outline-none focus:border-accent resize-none"
              disabled={isRunning}
            />
            <button
              type="submit"
              disabled={isRunning || !goal.trim()}
              className="bg-accent text-bg-primary px-8 py-3 text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRunning ? "Team is working..." : "Deploy Team"}
            </button>
          </form>
        </div>

        {/* Agent Output Stream */}
        {messages.length > 0 && (
          <div className="border border-border bg-bg-secondary">
            <div className="border-b border-border px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-text-secondary font-medium uppercase tracking-widest">
                Team Activity
              </span>
              {isRunning && (
                <span className="text-xs text-accent animate-pulse">Live</span>
              )}
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto font-mono text-sm space-y-1">
              {messages.map((msg, i) => (
                <div key={i} className="flex gap-3">
                  <span className={`shrink-0 w-28 text-right ${agentColors[msg.agent] || "text-text-secondary"}`}>
                    {msg.agent}
                  </span>
                  <span className="text-text-secondary">|</span>
                  <span className="text-text-primary">{msg.content}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

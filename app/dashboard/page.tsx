"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";
import ConnectShopifyButton from "@/components/ConnectShopifyButton";
import ConnectApiKeyForm from "@/components/ConnectApiKeyForm";

interface AgentMessage {
  agent: string;
  content: string;
  timestamp: string;
  node?: string;
}

interface RecentGoal {
  id: string;
  title: string;
  status: "pending" | "running" | "completed" | "failed";
  created_at: string;
  completed_at: string | null;
}

interface ShopifyConnection {
  shop_domain: string;
}

interface ApiKeyRecord {
  provider: string;
  model_name: string;
  is_active: boolean;
}

interface Subscription {
  plan: string;
  status: string;
}

const agentColors: Record<string, string> = {
  supervisor: "text-accent",
  planner: "text-blue-400",
  researcher: "text-emerald-400",
  executor: "text-orange-400",
  reviewer: "text-purple-400",
};

const statusColors: Record<string, string> = {
  pending: "text-text-secondary bg-text-secondary/10",
  running: "text-accent bg-accent/10",
  completed: "text-emerald-400 bg-emerald-400/10",
  failed: "text-red-400 bg-red-400/10",
};

export default function DashboardPage() {
  const [goal, setGoal] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  // Onboarding state
  const [shopifyConnection, setShopifyConnection] = useState<ShopifyConnection | null>(null);
  const [activeApiKey, setActiveApiKey] = useState<ApiKeyRecord | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [recentGoals, setRecentGoals] = useState<RecentGoal[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient();

  const fetchUserData = useCallback(
    async (userId: string) => {
      const [shopifyRes, apiKeyRes, subRes, goalsRes] = await Promise.all([
        supabase
          .from("shopify_connections")
          .select("shop_domain")
          .eq("user_id", userId)
          .limit(1)
          .single(),
        supabase
          .from("api_keys")
          .select("provider, model_name, is_active")
          .eq("user_id", userId)
          .eq("is_active", true)
          .limit(1)
          .single(),
        supabase
          .from("subscriptions")
          .select("plan, status")
          .eq("user_id", userId)
          .eq("status", "active")
          .limit(1)
          .single(),
        supabase
          .from("goals")
          .select("id, title, status, created_at, completed_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (shopifyRes.data) setShopifyConnection(shopifyRes.data);
      if (apiKeyRes.data) setActiveApiKey(apiKeyRes.data);
      if (subRes.data) setSubscription(subRes.data);
      if (goalsRes.data) setRecentGoals(goalsRes.data);
    },
    [supabase]
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || "" });
        fetchUserData(data.user.id);
      } else {
        router.push("/auth");
      }
      setLoading(false);
    });
  }, [fetchUserData, router, supabase.auth]);

  // Toast for Shopify callback
  useEffect(() => {
    if (searchParams.get("shopify") === "connected") {
      setToast("Shopify connected");
      const timer = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim() || isRunning) return;

    setIsRunning(true);
    setMessages([]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      // Build llmConfig from active API key
      const llmConfig = activeApiKey
        ? { provider: activeApiKey.provider, model: activeApiKey.model_name }
        : undefined;

      const response = await fetch("/api/trigger-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ goal, llmConfig }),
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

      // Refresh recent goals after run
      if (user) {
        const { data } = await supabase
          .from("goals")
          .select("id, title, status, created_at, completed_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (data) setRecentGoals(data);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <span className="text-text-secondary text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-400/10 text-emerald-400 text-sm px-5 py-3 rounded-xl border border-emerald-400/20">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-bg-primary/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-heading text-lg font-medium tracking-tight"
          >
            ForgeTeams
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/settings"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Settings
            </Link>
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-text-secondary">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* Onboarding */}
        <section>
          <h2 className="font-heading text-xl font-bold mb-2">Setup</h2>
          <p className="text-text-secondary text-sm mb-8">
            Complete these three steps to get your team running.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 01: Shopify */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-xs font-medium uppercase tracking-widest">
                  01
                </span>
                {shopifyConnection && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </div>
              <h3 className="font-heading text-base font-semibold">
                Connect Shopify
              </h3>
              <ConnectShopifyButton
                connected={!!shopifyConnection}
                shopDomain={shopifyConnection?.shop_domain}
              />
            </div>

            {/* Step 02: AI Provider */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-xs font-medium uppercase tracking-widest">
                  02
                </span>
                {activeApiKey && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </div>
              <h3 className="font-heading text-base font-semibold">
                Connect AI Provider
              </h3>
              <ConnectApiKeyForm
                hasKey={!!activeApiKey}
                provider={activeApiKey?.provider}
                model={activeApiKey?.model_name}
              />
            </div>

            {/* Step 03: Plan */}
            <div className="bg-bg-secondary border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-xs font-medium uppercase tracking-widest">
                  03
                </span>
                {subscription && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </div>
              <h3 className="font-heading text-base font-semibold">
                Choose Plan
              </h3>
              {subscription ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-primary text-sm font-medium capitalize">
                    {subscription.plan}
                  </span>
                  <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-text-secondary text-sm">Free Trial</p>
                  <Link
                    href="/pricing"
                    className="block w-full text-center bg-accent text-bg-primary px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors"
                  >
                    Upgrade
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Mission Control */}
        <section>
          <h2 className="font-heading text-xl font-bold mb-2">
            Mission Control
          </h2>
          <p className="text-text-secondary text-sm mb-8">
            Describe your goal. Your team of five agents will handle the rest.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Grow my Shopify revenue 30% this quarter..."
              rows={3}
              className="w-full bg-bg-secondary border border-border rounded-2xl px-5 py-4 text-text-primary placeholder-text-secondary/50 text-sm focus:outline-none focus:border-accent transition-colors resize-none"
              disabled={isRunning}
            />
            <button
              type="submit"
              disabled={isRunning || !goal.trim()}
              className="bg-accent text-bg-primary px-8 py-3 rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRunning ? "Team is working..." : "Deploy Team"}
            </button>
          </form>

          {/* Agent Output Stream */}
          {messages.length > 0 && (
            <div className="mt-8 border border-border bg-bg-secondary rounded-2xl overflow-hidden">
              <div className="border-b border-border px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium uppercase tracking-widest">
                  Team Activity
                </span>
                {isRunning && (
                  <span className="text-xs text-accent animate-pulse">
                    Live
                  </span>
                )}
              </div>
              <div className="p-5 max-h-[500px] overflow-y-auto font-mono text-sm space-y-1">
                {messages.map((msg, i) => (
                  <div key={i} className="flex gap-3">
                    <span
                      className={`shrink-0 w-28 text-right ${agentColors[msg.agent] || "text-text-secondary"}`}
                    >
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
        </section>

        {/* Recent Runs */}
        {recentGoals.length > 0 && (
          <section>
            <h2 className="font-heading text-xl font-bold mb-6">
              Recent Runs
            </h2>
            <div className="space-y-3">
              {recentGoals.map((g) => (
                <div
                  key={g.id}
                  className="bg-bg-secondary border border-border rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">
                      {g.title}
                    </p>
                    <p className="text-text-secondary text-xs mt-0.5">
                      {new Date(g.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[g.status] || "text-text-secondary"}`}
                  >
                    {g.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

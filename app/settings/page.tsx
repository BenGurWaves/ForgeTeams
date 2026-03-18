"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";

interface ApiKeyEntry {
  id: string;
  provider: string;
  model_name: string;
  is_active: boolean;
  created_at: string;
}

const providers = [
  { value: "ollama", label: "Ollama (Local)", placeholder: "Not required for local" },
  { value: "anthropic", label: "Anthropic", placeholder: "sk-ant-..." },
  { value: "openai", label: "OpenAI", placeholder: "sk-..." },
  { value: "xai", label: "xAI (Grok)", placeholder: "xai-..." },
];

const defaultModels: Record<string, string> = {
  ollama: "qwen3-coder:latest",
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  xai: "grok-3",
};

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [newProvider, setNewProvider] = useState("ollama");
  const [newKey, setNewKey] = useState("");
  const [newModel, setNewModel] = useState(defaultModels.ollama);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ email: data.user.email || "" });
        loadKeys();
      } else {
        router.push("/auth");
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setNewModel(defaultModels[newProvider] || "");
  }, [newProvider]);

  async function loadKeys() {
    const { data } = await supabase
      .from("api_keys")
      .select("id, provider, model_name, is_active, created_at")
      .order("created_at", { ascending: false });
    setKeys(data || []);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    // Validate provider connectivity / key format
    const validateRes = await fetch("/api/validate-provider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: newProvider, key: newKey }),
    });
    const validation = await validateRes.json();

    if (!validation.valid) {
      setError(validation.error);
      setSaving(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      setSaving(false);
      return;
    }

    const { error: dbError } = await supabase.from("api_keys").insert({
      user_id: user.id,
      provider: newProvider,
      encrypted_key: newKey || "local",
      model_name: newModel,
      is_active: true,
    });

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    setNewKey("");
    setSuccess(`${newProvider} provider added successfully.`);
    await loadKeys();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("api_keys").delete().eq("id", id);
    await loadKeys();
  }

  async function handleToggle(id: string, current: boolean) {
    await supabase.from("api_keys").update({ is_active: !current }).eq("id", id);
    await loadKeys();
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
      <header className="border-b border-border bg-bg-primary/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-heading text-lg font-medium tracking-tight">
            ForgeTeams
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="text-text-secondary hover:text-text-primary transition-colors">
              Dashboard
            </Link>
            {user && <span className="text-text-secondary">{user.email}</span>}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-heading text-2xl font-bold mb-2">Settings</h1>
        <p className="text-text-secondary text-sm mb-10">
          Configure your AI provider and model. Your keys are stored securely per-account.
        </p>

        {/* Add New Key */}
        <div className="border border-border bg-bg-secondary rounded-2xl p-6 mb-8">
          <h2 className="font-heading text-lg font-medium mb-4">Add Provider</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs text-text-secondary mb-2 uppercase tracking-widest">
                Provider
              </label>
              <div className="relative">
                <select
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
                >
                  {providers.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {newProvider !== "ollama" && (
              <div>
                <label className="block text-xs text-text-secondary mb-2 uppercase tracking-widest">
                  API Key
                </label>
                <input
                  type="password"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder={providers.find((p) => p.value === newProvider)?.placeholder}
                  className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-text-secondary mb-2 uppercase tracking-widest">
                Model
              </label>
              <input
                type="text"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            {success && (
              <p className="text-emerald-400 text-sm bg-emerald-400/10 rounded-xl px-4 py-3">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-accent text-bg-primary px-6 py-3 rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Validating..." : "Add Provider"}
            </button>
          </form>
        </div>

        {/* Existing Keys */}
        <div>
          <h2 className="font-heading text-lg font-medium mb-4">Active Providers</h2>
          {keys.length === 0 ? (
            <div className="border border-border bg-bg-secondary rounded-2xl p-8 text-center">
              <p className="text-text-secondary text-sm">
                No providers configured. Add one above to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="border border-border bg-bg-secondary rounded-2xl p-5 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{key.provider}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-lg ${key.is_active ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"}`}>
                        {key.is_active ? "active" : "disabled"}
                      </span>
                    </div>
                    <span className="text-xs text-text-secondary mt-1 block">
                      {key.model_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(key.id, key.is_active)}
                      className="text-xs text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-bg-primary"
                    >
                      {key.is_active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-900/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

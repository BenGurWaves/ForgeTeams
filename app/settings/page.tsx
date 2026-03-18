"use client";

import { useState, useEffect } from "react";
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
  const supabase = createBrowserClient();

  useEffect(() => {
    loadKeys();
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    await supabase.from("api_keys").insert({
      user_id: user.id,
      provider: newProvider,
      encrypted_key: newKey || "local",
      model_name: newModel,
      is_active: true,
    });

    setNewKey("");
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

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-border bg-bg-primary/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-heading text-lg font-medium tracking-tight">
            ForgeTeams
          </Link>
          <Link href="/dashboard" className="text-text-secondary text-sm hover:text-text-primary transition-colors">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-heading text-2xl font-bold mb-2">Settings</h1>
        <p className="text-text-secondary text-sm mb-10">
          Configure your AI provider and model. Your keys are stored securely per-account.
        </p>

        {/* Add New Key */}
        <div className="border border-border bg-bg-secondary p-6 mb-8">
          <h2 className="font-heading text-lg font-medium mb-4">Add Provider</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs text-text-secondary mb-2 uppercase tracking-widest">
                Provider
              </label>
              <select
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value)}
                className="w-full bg-bg-primary border border-border px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                {providers.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
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
                  className="w-full bg-bg-primary border border-border px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent"
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
                className="w-full bg-bg-primary border border-border px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-accent text-bg-primary px-6 py-2.5 text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-40"
            >
              {saving ? "Saving..." : "Add Provider"}
            </button>
          </form>
        </div>

        {/* Existing Keys */}
        <div>
          <h2 className="font-heading text-lg font-medium mb-4">Active Providers</h2>
          {keys.length === 0 ? (
            <p className="text-text-secondary text-sm">
              No providers configured. Add one above to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="border border-border bg-bg-secondary p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{key.provider}</span>
                      <span className={`text-xs px-2 py-0.5 ${key.is_active ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"}`}>
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
                      className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {key.is_active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
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

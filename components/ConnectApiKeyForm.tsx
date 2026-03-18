"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

interface ConnectApiKeyFormProps {
  hasKey: boolean;
  provider?: string;
  model?: string;
}

type Provider = "ollama" | "anthropic" | "openai" | "xai";

const DEFAULT_MODELS: Record<Provider, string> = {
  ollama: "qwen3.5:4b",
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  xai: "grok-3",
};

const PROVIDER_LABELS: Record<Provider, string> = {
  ollama: "Ollama",
  anthropic: "Anthropic",
  openai: "OpenAI",
  xai: "xAI",
};

export default function ConnectApiKeyForm({
  hasKey,
  provider: existingProvider,
  model: existingModel,
}: ConnectApiKeyFormProps) {
  const [showForm, setShowForm] = useState(!hasKey);
  const [provider, setProvider] = useState<Provider>("ollama");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState(DEFAULT_MODELS.ollama);
  const [status, setStatus] = useState<"idle" | "validating" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const supabase = createBrowserClient();

  function handleProviderChange(newProvider: Provider) {
    setProvider(newProvider);
    setModelName(DEFAULT_MODELS[newProvider]);
    setApiKey("");
    setStatus("idle");
    setStatusMessage("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("validating");
    setStatusMessage("Validating...");

    try {
      const validateRes = await fetch("/api/validate-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          key: provider !== "ollama" ? apiKey : undefined,
        }),
      });

      const validateData = await validateRes.json();

      if (!validateData.valid) {
        setStatus("error");
        setStatusMessage(validateData.error || "Validation failed");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus("error");
        setStatusMessage("Not authenticated");
        return;
      }

      // Deactivate existing keys
      await supabase
        .from("api_keys")
        .update({ is_active: false })
        .eq("user_id", user.id);

      // Insert new key
      const { error: insertError } = await supabase.from("api_keys").insert({
        user_id: user.id,
        provider,
        encrypted_key: provider === "ollama" ? "local" : apiKey,
        model_name: modelName,
        is_active: true,
      });

      if (insertError) {
        setStatus("error");
        setStatusMessage(insertError.message);
        return;
      }

      setStatus("success");
      setStatusMessage("Provider saved");
      setTimeout(() => {
        setShowForm(false);
      }, 1500);
    } catch (err) {
      setStatus("error");
      setStatusMessage(err instanceof Error ? err.message : "Unexpected error");
    }
  }

  if (!showForm && hasKey) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-text-primary text-sm font-medium block truncate">
              {PROVIDER_LABELS[(existingProvider as Provider) || "ollama"] ?? existingProvider}
            </span>
            <span className="text-text-secondary text-xs block truncate">
              {existingModel}
            </span>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Connected
          </span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-text-secondary text-xs hover:text-text-primary transition-colors"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Provider Select */}
      <div className="relative">
        <select
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value as Provider)}
          className="w-full appearance-none bg-bg-primary border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
        >
          <option value="ollama">Ollama</option>
          <option value="anthropic">Anthropic</option>
          <option value="openai">OpenAI</option>
          <option value="xai">xAI</option>
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* API Key (hidden for Ollama) */}
      {provider !== "ollama" && (
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`${PROVIDER_LABELS[provider]} API Key`}
          className="w-full bg-bg-primary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
          required
        />
      )}

      {/* Model */}
      <input
        type="text"
        value={modelName}
        onChange={(e) => setModelName(e.target.value)}
        placeholder="Model name"
        className="w-full bg-bg-primary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
        required
      />

      {/* Status Message */}
      {status === "success" && (
        <div className="bg-emerald-400/10 text-emerald-400 text-xs px-4 py-2.5 rounded-xl">
          {statusMessage}
        </div>
      )}
      {status === "error" && (
        <div className="bg-red-400/10 text-red-400 text-xs px-4 py-2.5 rounded-xl">
          {statusMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "validating"}
        className="w-full bg-accent text-bg-primary px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "validating" ? "Validating..." : "Validate & Save"}
      </button>
    </form>
  );
}

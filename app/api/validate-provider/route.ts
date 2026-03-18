import { NextRequest } from "next/server";

// Key format patterns
const KEY_PATTERNS: Record<string, RegExp> = {
  anthropic: /^sk-ant-[a-zA-Z0-9_-]{20,}$/,
  openai: /^sk-[a-zA-Z0-9_-]{20,}$/,
  xai: /^xai-[a-zA-Z0-9_-]{20,}$/,
};

export async function POST(request: NextRequest) {
  const { provider, key, baseUrl } = await request.json();

  // Ollama: test actual connectivity
  if (provider === "ollama") {
    const url = baseUrl || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    try {
      const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) {
        return Response.json({ valid: false, error: `Ollama responded with ${res.status}` });
      }
      const data = await res.json();
      const models = (data.models || []).map((m: { name: string }) => m.name);
      return Response.json({ valid: true, models });
    } catch {
      return Response.json({
        valid: false,
        error: "Cannot reach Ollama. Make sure it is running: ollama serve",
      });
    }
  }

  // Cloud providers: validate key format
  const pattern = KEY_PATTERNS[provider];
  if (!pattern) {
    return Response.json({ valid: false, error: `Unknown provider: ${provider}` });
  }

  if (!key || !pattern.test(key)) {
    return Response.json({
      valid: false,
      error: `Invalid ${provider} API key format. Expected format: ${provider === "anthropic" ? "sk-ant-..." : provider === "openai" ? "sk-..." : "xai-..."}`,
    });
  }

  return Response.json({ valid: true });
}

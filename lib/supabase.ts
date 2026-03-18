import { createClient } from "@supabase/supabase-js";

// Browser client — uses anon key, respects RLS
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, anonKey);
}

// Server client — uses service role key, bypasses RLS
// Only use in API routes and server actions
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Types matching the database schema
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  provider: "anthropic" | "openai" | "xai" | "ollama";
  encrypted_key: string;
  model_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "pending" | "running" | "completed" | "failed";
  result: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

export interface AgentRun {
  id: string;
  goal_id: string;
  user_id: string;
  agent_name: "planner" | "researcher" | "executor" | "reviewer" | "supervisor";
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  tokens_used: number;
  duration_ms: number;
  status: "running" | "completed" | "failed";
  error: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  goal_id: string;
  user_id: string;
  agent_name: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

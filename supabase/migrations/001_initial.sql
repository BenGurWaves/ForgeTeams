-- ForgeTeams: Initial Schema
-- Multi-tenant with Row Level Security on every table

-- Enable pgvector for memory embeddings
create extension if not exists vector with schema extensions;

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- API KEYS (BYOK — Bring Your Own Key)
-- ============================================================
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('anthropic', 'openai', 'xai', 'ollama')),
  encrypted_key text not null,
  model_name text not null default 'qwen3-coder:latest',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.api_keys enable row level security;

create policy "Users can manage own api keys"
  on public.api_keys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_api_keys_user on public.api_keys(user_id);

-- ============================================================
-- GOALS
-- ============================================================
create type goal_status as enum ('pending', 'running', 'completed', 'failed');

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status goal_status not null default 'pending',
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.goals enable row level security;

create policy "Users can manage own goals"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_goals_user on public.goals(user_id);
create index idx_goals_status on public.goals(user_id, status);

-- ============================================================
-- AGENT RUNS (individual agent executions within a goal)
-- ============================================================
create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_name text not null check (agent_name in ('planner', 'researcher', 'executor', 'reviewer', 'supervisor')),
  input jsonb,
  output jsonb,
  tokens_used integer default 0,
  duration_ms integer default 0,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

alter table public.agent_runs enable row level security;

create policy "Users can view own agent runs"
  on public.agent_runs for select
  using (auth.uid() = user_id);

create policy "Service can insert agent runs"
  on public.agent_runs for insert
  with check (auth.uid() = user_id);

create index idx_agent_runs_goal on public.agent_runs(goal_id);

-- ============================================================
-- MESSAGES (SSE stream source — real-time agent output)
-- ============================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_name text not null,
  role text not null default 'assistant' check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = user_id);

create policy "Service can insert messages"
  on public.messages for insert
  with check (auth.uid() = user_id);

create index idx_messages_goal on public.messages(goal_id, created_at);

-- Enable realtime for messages (SSE streaming)
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- MEMORY VECTORS (per-tenant RAG memory via pgvector)
-- ============================================================
create table public.memory_vectors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.memory_vectors enable row level security;

create policy "Users can manage own memories"
  on public.memory_vectors for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- HNSW index for fast similarity search
create index idx_memory_vectors_embedding
  on public.memory_vectors
  using hnsw (embedding vector_cosine_ops);

-- Similarity search function
create or replace function match_memories(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  p_user_id uuid default auth.uid()
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql security definer
as $$
begin
  return query
  select
    mv.id,
    mv.content,
    mv.metadata,
    1 - (mv.embedding <=> query_embedding) as similarity
  from public.memory_vectors mv
  where mv.user_id = p_user_id
    and 1 - (mv.embedding <=> query_embedding) > match_threshold
  order by mv.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ============================================================
-- USAGE TRACKING
-- ============================================================
create table public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  model text not null,
  provider text not null default 'ollama',
  created_at timestamptz not null default now()
);

alter table public.usage enable row level security;

create policy "Users can view own usage"
  on public.usage for select
  using (auth.uid() = user_id);

create policy "Service can insert usage"
  on public.usage for insert
  with check (auth.uid() = user_id);

create index idx_usage_user on public.usage(user_id, created_at);

-- ============================================================
-- UPDATED_AT TRIGGER (reusable)
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger api_keys_updated_at
  before update on public.api_keys
  for each row execute function public.update_updated_at();

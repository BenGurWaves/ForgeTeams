-- 002_production.sql
-- Adds Shopify OAuth, Stripe subscriptions, and enhanced multi-tenant RLS.
-- Depends on 001_initial.sql (profiles, api_keys, goals, agent_runs, messages,
-- memory_vectors, usage tables, update_updated_at function).

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ============================================================================
-- shopify_connections
-- ============================================================================

create table if not exists public.shopify_connections (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references auth.users(id) on delete cascade,
  shop_domain           text        not null,
  encrypted_access_token text       not null,
  scopes                text        not null,
  installed_at          timestamptz not null default now(),
  unique (user_id, shop_domain)
);

create index if not exists idx_shopify_connections_user_id
  on public.shopify_connections (user_id);

alter table public.shopify_connections enable row level security;

create policy "Users can select own shopify connections"
  on public.shopify_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own shopify connections"
  on public.shopify_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own shopify connections"
  on public.shopify_connections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own shopify connections"
  on public.shopify_connections for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- subscriptions
-- ============================================================================

create table if not exists public.subscriptions (
  id                      uuid        primary key default gen_random_uuid(),
  user_id                 uuid        not null references auth.users(id) on delete cascade,
  stripe_customer_id      text        not null,
  stripe_subscription_id  text        unique,
  plan                    text        not null default 'starter'
                                      check (plan in ('starter', 'pro', 'enterprise')),
  status                  text        not null default 'active'
                                      check (status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean     default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_id
  on public.subscriptions (user_id);

-- Reuse the update_updated_at function from 001_initial.sql
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.update_updated_at();

alter table public.subscriptions enable row level security;

-- Users can read their own subscription
create policy "Users can select own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- INSERT and UPDATE are service-role only (no user-facing policies)
-- Stripe webhooks write via the service role key, which bypasses RLS.

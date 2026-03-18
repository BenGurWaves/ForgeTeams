# ForgeTeams

**Forge Your Autonomous AI Teams for eCommerce.**

Five specialized AI agents — Planner, Researcher, Executor, Reviewer, and Supervisor — collaborate autonomously to achieve your Shopify business goals. Set a target like "Grow revenue 30% this quarter" and watch your team research, plan, execute, review, and iterate until it is done.

Last updated: March 2026.

---

## Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Deployment:** Cloudflare Workers via @opennextjs/cloudflare
- **Agents:** @langchain/langgraph (multi-agent state graph)
- **Database:** Supabase (Postgres + pgvector + pgcrypto + Auth + Realtime)
- **LLM:** Ollama (local dev) / BYOK (Anthropic, OpenAI, xAI)
- **Payments:** Stripe (subscriptions + usage metering)
- **Shopify:** Custom app OAuth (offline access tokens)

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Ollama ([ollama.com](https://ollama.com))

### 1. Clone and install

```bash
git clone https://github.com/BenGurWaves/ForgeTeams.git
cd ForgeTeams
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your credentials:

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings (keep secret) |
| `ENCRYPTION_KEY` | Generate: `openssl rand -hex 32` |
| `SHOPIFY_API_KEY` | Shopify Partners > App > API credentials |
| `SHOPIFY_API_SECRET` | Shopify Partners > App > API credentials |
| `STRIPE_SECRET_KEY` | Stripe dashboard > API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard > Webhooks |

### 3. Run database migrations

Open the Supabase SQL Editor and run both migrations in order:

1. `supabase/migrations/001_initial.sql` — Core tables (profiles, goals, agent_runs, messages, api_keys, usage, memory_vectors)
2. `supabase/migrations/002_production.sql` — Production tables (shopify_connections, subscriptions, pgcrypto)

### 4. Create a Shopify custom app

1. Go to Shopify Partners > Apps > Create app
2. Set redirect URL to `http://localhost:3000/api/shopify/callback`
3. Copy API key and secret to `.env.local`
4. Required scopes: `read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_draft_orders,write_draft_orders`

### 5. Set up Stripe

1. Create products in Stripe dashboard:
   - Starter: $99/mo
   - Pro: $299/mo
   - Enterprise: $599/mo
2. Copy price IDs for use in checkout
3. Create webhook endpoint pointing to `http://localhost:3000/api/stripe/webhook`
4. Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 6. Pull an Ollama model

```bash
ollama pull qwen3.5:4b          # Fast, good for agent loops
ollama pull qwen3-coder:latest  # Stronger coding
ollama pull deepseek-r1:32b     # Heavy reasoning
```

### 7. Start Ollama and dev server

```bash
ollama serve
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 8. Test the agent team (standalone)

```bash
pnpm test:agents
```

---

## Project Structure

```
ForgeTeams/
├── app/
│   ├── layout.tsx                  Root layout + metadata + JSON-LD
│   ├── globals.css                 Theme: obsidian dark + muted gold accent
│   ├── page.tsx                    Landing page
│   ├── auth/page.tsx               Email/password sign-in + sign-up
│   ├── dashboard/page.tsx          Onboarding + goal input + agent stream + recent runs
│   ├── settings/page.tsx           BYOK key management + model config
│   └── api/
│       ├── auth/callback/          Supabase OAuth handler
│       ├── shopify/authorize/      Shopify OAuth start (redirect to Shopify)
│       ├── shopify/callback/       Shopify OAuth callback (exchange code for token)
│       ├── stripe/checkout/        Create Stripe Checkout session
│       ├── stripe/webhook/         Stripe webhook handler
│       ├── trigger-agent/          POST: runs graph, returns SSE stream
│       ├── validate-provider/      POST: validates Ollama connection or API key format
│       └── usage/                  GET: token usage stats
├── components/
│   ├── ConnectShopifyButton.tsx    Shopify store connection UI
│   └── ConnectApiKeyForm.tsx       BYOK provider + key + model form
├── lib/
│   ├── agents/
│   │   ├── state.ts                Typed state (Zod schemas + LangGraph Annotation)
│   │   ├── graph.ts                5-node LangGraph with conditional routing
│   │   ├── tools.ts                BYOK LLM support + Ollama fallback + Shopify stubs
│   │   └── test-ollama.ts          Standalone test script
│   ├── encryption.ts               AES-256-GCM encrypt/decrypt for tokens and keys
│   └── supabase.ts                 Browser + server Supabase clients
├── supabase/
│   └── migrations/
│       ├── 001_initial.sql         Core schema with RLS + pgvector
│       └── 002_production.sql      Shopify + Stripe + pgcrypto
├── package.json
├── wrangler.toml
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## Agent Architecture

```
User Goal → Supervisor → Planner → Researcher → Executor → Reviewer
                ↑                                              |
                └──────── (rejected: iterate) ─────────────────┘
```

- **Supervisor** routes work based on current state
- **Planner** breaks goals into prioritized steps
- **Researcher** gathers market data (web search + RAG stubs)
- **Executor** takes Shopify actions (pricing, email, discounts — stubs)
- **Reviewer** scores results and approves or sends back
- Max 3 iterations before forced completion
- 90s timeout per LLM call with error recovery

---

## BYOK (Bring Your Own Key)

Users configure their API keys in the dashboard onboarding flow or Settings. Keys are encrypted with AES-256-GCM before storage.

| Provider | Default Model | Key Format |
|----------|--------------|------------|
| Ollama | qwen3.5:4b | Not required |
| Anthropic | claude-sonnet-4-20250514 | sk-ant-... |
| OpenAI | gpt-4o | sk-... |
| xAI | grok-3 | xai-... |

---

## Cloudflare Deployment

### 1. Build and deploy

```bash
pnpm build:cf
pnpm deploy
```

### 2. Set secrets

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put SHOPIFY_API_SECRET
wrangler secret put ENCRYPTION_KEY
```

### 3. Set environment variables

In the Cloudflare dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `SHOPIFY_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## Pricing Plans

| Plan | Price | Included |
|------|-------|----------|
| Starter | $99/mo | 50 agent runs/mo, 1 Shopify store |
| Pro | $299/mo | 200 agent runs/mo, 3 stores, priority models |
| Enterprise | $599/mo | Unlimited runs, unlimited stores, dedicated support |

---

## Security

- All API keys and Shopify tokens encrypted at rest (AES-256-GCM)
- Shopify OAuth with HMAC validation and state nonce
- Stripe webhook signature verification
- Row Level Security on every Supabase table
- Per-tenant data isolation
- Zod validation on all API inputs

---

## FAQ

**Do I need cloud API keys to test locally?**
No. Ollama runs entirely local. No API keys needed for development.

**Is my data isolated from other users?**
Yes. Every Supabase table uses Row Level Security. Each user only sees their own data.

**Which Ollama model should I use?**
`qwen3.5:4b` for fast iteration (3.4GB, ~110 t/s). `qwen3-coder:latest` for higher quality but slower (18GB).

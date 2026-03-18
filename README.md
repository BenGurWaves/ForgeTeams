# ForgeTeams

**Forge Your Autonomous AI Teams for eCommerce.**

Five specialized AI agents — Planner, Researcher, Executor, Reviewer, and Supervisor — collaborate autonomously to achieve your Shopify business goals. Set a target like "Grow revenue 30% this quarter" and watch your team research, plan, execute, review, and iterate until it is done.

Last updated: March 2026.

---

## Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Deployment:** Cloudflare Workers via @opennextjs/cloudflare
- **Agents:** @langchain/langgraph (multi-agent state graph)
- **Database:** Supabase (Postgres + pgvector + Auth + Realtime)
- **LLM:** Ollama (local dev) / BYOK (Anthropic, OpenAI, xAI)

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

Edit `.env.local` with your Supabase credentials.

### 3. Run database migration

Open the Supabase SQL Editor and paste the contents of `supabase/migrations/001_initial.sql`. Run it.

Or if you have the Supabase CLI:

```bash
supabase db push
```

### 4. Pull an Ollama model

```bash
ollama pull qwen3-coder:latest
```

Other recommended models for testing:

```bash
ollama pull deepseek-r1:32b      # Heavier reasoning
ollama pull qwen3.5:27b          # Strong general purpose
```

### 5. Start Ollama

```bash
ollama serve
```

### 6. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Test the agent team (standalone)

```bash
pnpm test:agents
```

This runs the full 5-agent team on a sample goal and streams output to your terminal. No browser needed.

---

## Project Structure

```
ForgeTeams/
├── app/
│   ├── layout.tsx              Root layout + metadata + JSON-LD
│   ├── globals.css             Theme: obsidian dark + muted gold accent
│   ├── page.tsx                Landing page
│   ├── dashboard/page.tsx      Goal input + agent stream viewer
│   ├── settings/page.tsx       BYOK key management + model config
│   └── api/
│       ├── auth/callback/      Supabase OAuth handler
│       ├── trigger-agent/      POST: runs graph, returns SSE stream
│       └── usage/              GET: token usage stats
├── lib/
│   ├── agents/
│   │   ├── state.ts            Typed state (Zod schemas + LangGraph Annotation)
│   │   ├── graph.ts            5-node LangGraph with conditional routing
│   │   ├── tools.ts            Ollama LLM + Shopify stubs + research stubs
│   │   └── test-ollama.ts      Standalone test script
│   └── supabase.ts             Browser + server Supabase clients
├── supabase/
│   └── migrations/
│       └── 001_initial.sql     Full schema with RLS + pgvector
├── package.json
├── wrangler.toml               Cloudflare Workers config
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
- Max 5 iterations before forced completion
- Error recovery routes failures back to Supervisor

---

## Cloudflare Deployment

### 1. Connect to GitHub

Link this repo to Cloudflare Pages in the Cloudflare dashboard.

### 2. Build and deploy

```bash
pnpm build:cf
pnpm deploy
```

### 3. Set secrets

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put STRIPE_SECRET_KEY
```

### 4. Set environment variables

In the Cloudflare dashboard, add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## BYOK (Bring Your Own Key)

Users configure their own API keys in Settings (`/settings`). Supported providers:

| Provider | Models |
|----------|--------|
| Ollama | qwen3-coder, deepseek-r1, any local model |
| Anthropic | claude-sonnet-4-20250514, claude-opus-4-20250514 |
| OpenAI | gpt-4o, o1-pro |
| xAI | grok-3 |

---

## FAQ

**How do I change the default model?**
Set `OLLAMA_MODEL` in `.env.local`, or configure it per-user in Settings.

**Do I need cloud API keys to test locally?**
No. Ollama runs entirely local. No API keys needed for development.

**Is my data isolated from other users?**
Yes. Every Supabase table uses Row Level Security. Each user only sees their own data.

# ForgeTeams — Initial Build Design Spec

**Date:** 2026-03-18
**Status:** Approved
**Author:** Ben + Claude

---

## 1. Product

ForgeTeams is a multi-agent autonomous AI teams SaaS for eCommerce (Shopify) store owners. A 5-agent team (Planner, Researcher, Executor, Reviewer, Supervisor) takes a high-level business goal and autonomously researches, plans, executes, reviews, and iterates until the goal is met. Progress streams in real-time; a final report is delivered.

**Tagline:** "Forge Your Autonomous AI Teams for eCommerce"
**Hero:** "Your Autonomous AI Teams for Shopify — Planner, Researcher, Executor, Reviewer & Supervisor working together 24/7"

---

## 2. Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| Deployment | Cloudflare Workers via @opennextjs/cloudflare |
| Agent orchestration | @langchain/langgraph (JS/TS) |
| Database + Auth | Supabase (Postgres + pgvector + Auth) |
| Local LLM | Ollama (`qwen3-coder:latest` default) |
| Production LLM | BYOK — user provides Anthropic/OpenAI/xAI keys |
| Payments | Stripe (stub for now) |
| Shopify | Stub tools returning mock data |

---

## 3. Design System

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0F0F0F` | Page background (obsidian) |
| `--bg-secondary` | `#151515` | Cards, sections |
| `--text-primary` | `#F5F5F5` | Headings, body text |
| `--text-secondary` | `#A0A0A0` | Captions, metadata |
| `--accent` | `#C9A96E` | Primary CTA, highlights |
| `--accent-hover` | `#D4B98A` | Hover states |
| `--border` | `#222222` | Dividers, card borders |

### Typography
- **Headings:** Neue Montreal (fallback: system-ui, -apple-system). Weight 500 for headings, 700 for hero.
- **Body/UI:** Inter (Google Fonts, variable). Weight 400/500/600.
- **Line height:** 1.6–2.0 for body, tighter for headings.

### Visual Rules
- Minimalist, high-end aesthetic. Massive whitespace.
- No gradients, no bright colors, no bouncy animations.
- Gentle fade-ins only. Single focus per section.
- Calm atelier / private members club vibe.

---

## 4. Architecture

### File Structure
```
ForgeTeams/
├── app/
│   ├── layout.tsx              # Root layout, fonts, metadata
│   ├── globals.css             # Tailwind + CSS vars + theme
│   ├── page.tsx                # Landing page
│   ├── dashboard/
│   │   └── page.tsx            # Protected dashboard with goal input
│   ├── settings/
│   │   └── page.tsx            # BYOK keys + model config
│   └── api/
│       ├── auth/
│       │   └── callback/
│       │       └── route.ts    # Supabase auth callback
│       ├── trigger-agent/
│       │   └── route.ts        # POST: triggers graph, streams SSE
│       └── usage/
│           └── route.ts        # Usage tracking stub
├── lib/
│   ├── agents/
│   │   ├── graph.ts            # LangGraph: 5 nodes, conditional routing, error recovery
│   │   ├── tools.ts            # Ollama-powered tools + Shopify stubs
│   │   ├── state.ts            # Typed agent state (Zod schemas)
│   │   └── test-ollama.ts      # Standalone test script
│   └── supabase.ts             # Client + server Supabase clients
├── supabase/
│   └── migrations/
│       └── 001_initial.sql     # Full schema: users, teams, goals, runs, messages, settings, pgvector
├── components/
│   ├── landing/                # Landing page sections
│   ├── dashboard/              # Dashboard components
│   └── ui/                     # Shared UI primitives
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── wrangler.toml
├── .env.local                  # Secrets (gitignored)
├── .env.example                # Template for env vars
├── .gitignore
└── README.md
```

### Agent Graph (LangGraph)

```
[User Goal] → Supervisor → Planner → Researcher → Executor → Reviewer
                  ↑              ↑                               |
                  |              └───────── (needs more research) ←
                  └──────────────── (not approved, loop back) ────┘
```

**State:** Typed with Zod. Contains goal, plan, research findings, execution results, review feedback, iteration count, status, error info.

**Nodes:**
1. **Supervisor** — Routes to appropriate agent based on current state. Decides when done.
2. **Planner** — Breaks goal into actionable steps with priorities and dependencies.
3. **Researcher** — Mock web search + RAG stub. Returns competitor/market data.
4. **Executor** — Calls Shopify stub tools. Returns execution results.
5. **Reviewer** — Reflects on results. Approves or sends back with feedback.

**Edges:** Conditional. Supervisor routes based on state. Max 5 iterations before forced completion. Error recovery catches failures and routes to Supervisor.

### LLM Configuration
- **Default:** Ollama at `http://127.0.0.1:11434`, model `qwen3-coder:latest`
- **BYOK:** Settings page stores provider + API key + model name in Supabase (encrypted column)
- **Per-user:** Each user's agent runs use their configured LLM or falls back to default

---

## 5. Database Schema (Supabase)

All tables have `user_id` column with RLS policies enforcing `auth.uid() = user_id`.

### Tables
- **profiles** — user_id, email, display_name, created_at
- **api_keys** — user_id, provider (anthropic/openai/xai/ollama), encrypted_key, model_name, is_active
- **goals** — id, user_id, title, description, status (pending/running/completed/failed), created_at, completed_at
- **agent_runs** — id, goal_id, user_id, agent_name, input, output, tokens_used, duration_ms, status, created_at
- **messages** — id, goal_id, user_id, agent_name, role, content, created_at (SSE stream source)
- **memory_vectors** — id, user_id, content, embedding (vector(1536)), metadata, created_at
- **usage** — id, user_id, tokens_in, tokens_out, model, created_at

---

## 6. API Routes

### POST `/api/trigger-agent`
- Auth required (Supabase session)
- Body: `{ goal: string }`
- Creates goal record, starts LangGraph execution
- Returns SSE stream of agent messages
- On completion: updates goal status, writes final report

### POST `/api/auth/callback`
- Supabase OAuth callback handler

### GET `/api/usage`
- Returns usage stats for authenticated user

---

## 7. Pages

### Landing (`/`)
- Hero: headline + subtext + "Get Started" CTA
- Features grid: 5 agent cards
- How It Works: 3-step flow
- Testimonials: 3 fake quotes
- Final CTA

### Dashboard (`/dashboard`)
- Protected (redirect to auth if no session)
- Goal input form (textarea + submit)
- Active goal stream (SSE messages rendered in real-time)
- Goal history list

### Settings (`/settings`)
- Protected
- API key management (add/remove provider keys)
- Model selection per agent role
- Usage stats summary

---

## 8. Local Development

1. Clone repo
2. `pnpm install`
3. Copy `.env.example` → `.env.local`, fill Supabase creds
4. Run Supabase migration
5. Start Ollama with `qwen3-coder:latest`
6. `pnpm dev` → http://localhost:3000
7. Test agent: `npx tsx lib/agents/test-ollama.ts`

---

## 9. Deployment

- Cloudflare Workers via `pnpm build:cf && pnpm deploy`
- wrangler.toml configured for OpenNext adapter
- Environment variables set in Cloudflare dashboard

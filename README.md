# Echo — AI Communication Twin

A private assistant for my job search. Recruiter, referral and hiring messages from **Gmail** and **LinkedIn** land in one dashboard with a reply already drafted, in my voice and only saying true things about me. I edit if needed, approve, and send. No more copying every message into ChatGPT, and no more leaving people hanging.

> **Status: Milestone 0 working.** Paste a message → get a draft in your voice → edit → copy, with a "waiting on you" inbox. Runs locally on synthetic data and a deterministic fake model; no real accounts, keys or sends yet.

![Echo inbox: threads sorted by how long they've waited, with a reply panel](docs/screenshots/inbox.jpg)

## What works today (Milestone 0)

- **Paste a message** from LinkedIn or Gmail; it lands in the inbox as *waiting on you*.
- **Inbox sorted by who's waited longest**, with age badges that turn amber after 24h and red after 48h.
- **Draft a reply** by picking what you want to say (interested, need details, not now, decline, thanks, follow up), tone, length and extra instructions.
- **Only you decide:** questions about availability, salary, relocation, start date or visa are flagged, left as `[placeholders]`, and copying is blocked until you fill them in.
- **Grounded in your profile:** only verified facts reach the model; sensitive ones need an opt-in; invented fact references are dropped with a warning.
- **LinkedIn:** Copy for LinkedIn → Mark as sent manually, which moves the thread to *waiting on them*. There is no send button for LinkedIn.
- **Gmail:** shows the recipient and subject; Approve & Send is visible but disabled until Milestone 2.
- **Edits are versioned:** each edit is a new version, and stale edits are rejected.

## What it does

- **Inbox & Approvals.** Messages with AI-drafted replies. Change tone or length, edit, then approve. Gmail sends only after approval; LinkedIn replies are copied and sent by me.
- **Outreach Studio.** Paste a job description and contact, get a referral request, recruiter intro or follow-up.
- **Knowledge Base.** Resumes, verified skills, projects and example messages. Every claim in a draft comes from here.
- **Jobs & Contacts.** A light job-search CRM: who I contacted, what was sent, what's next.
- **Daily Digest.** What was drafted, approved, sent, failed, and what needs a follow-up.

## Guardrails

- **Nothing is sent without my approval.** Each approval covers one exact version of the draft.
- **No LinkedIn automation.** LinkedIn's developer access doesn't allow sending replies, so Echo never scrapes, runs bots, or sends DMs. LinkedIn is copy-and-paste only.
- **No invented facts.** Salary, availability and accepting interviews or offers are always my call.
- **No real messages, tokens or personal data** in the repo, logs or tests.

## Architecture

```mermaid
flowchart LR
    UI["React + TypeScript<br/>Vite · Tailwind · shadcn/ui<br/>(Cloudflare Pages)"]
    API["Cloudflare Workers API<br/>contracts · policy · outbox"]
    AI["LLM adapter<br/>(swappable provider)"]
    DB[("Supabase<br/>Postgres + pgvector<br/>Auth · Storage")]
    GMAIL["Gmail API"]
    LI["LinkedIn<br/>(paste in / copy out by me)"]

    UI --> API
    API --> AI
    API --> DB
    API -->|after approval| GMAIL
    LI -. manual .-> UI
```

The backend's policy layer (not the model) decides what's allowed. A send queue with idempotency keys guarantees one email per approval. Full details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Roadmap

| Milestone | Scope | Status |
|---|---|---|
| 0 — Foundation | Contracts, core rules, model adapter, Worker API, web app; one working paste → draft → copy path | ✅ First slice working |
| 1 — Knowledge Base + Outreach Studio | Profile and resumes, JD/contact intake, drafting, edit/copy, LinkedIn manual sends, job CRM | — |
| 2 — Gmail outbound | OAuth `gmail.send`, approval, outbox, idempotent sending | — |
| 3 — Gmail inbox | Read threads, classify, draft replies in-thread | — |
| 4 — Personalization + RAG | Style learning from edits, embeddings, eval set | — |
| 5 — CRM + Digests | Reminders, response tracking, daily summary | — |
| 6 — More integrations | Slack notifications, low-risk templates | — |
| 7 — Hardening | E2E suite, CI/CD, monitoring, deployment | — |

## Repository layout (planned)

```
echo/
├── apps/web/            # React UI
├── workers/api/         # Cloudflare Workers backend
├── packages/
│   ├── contracts/       # shared Zod schemas
│   ├── core/            # domain rules + policy engine
│   ├── ai/              # model adapter, prompts, evals
│   └── connectors/      # Gmail and future providers
├── supabase/            # migrations + synthetic seed data
├── evals/               # redacted fixtures
├── docs/                # PRD, architecture, decisions, review, tasks, mockups
├── AGENTS.md            # rules for coding agents
└── CLAUDE.md            # Claude Code instructions
```

Today `packages/contracts`, `packages/core`, `packages/ai`, `workers/api` and `apps/web` exist. `packages/connectors`, `supabase/` and `evals/` are created when their milestone needs them.

## Docs

| File | What's in it |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements: problem, features, data model, APIs, roadmap, test plan |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Components, flows, state machine, environments |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decisions with reasons |
| [`docs/ROAST.md`](docs/ROAST.md) | Open review items, with recommendations |
| [`docs/GRILL.md`](docs/GRILL.md) | One question per review item, with answers |
| [`docs/tasks/`](docs/tasks/) | Work tickets |
| [`docs/assets/`](docs/assets/) | Concept mockups (direction only, not a working app) |

## History

The first commit is the original build kit generated with ChatGPT, unchanged. Later commits show how the plan was reviewed and adapted. Built with Claude Code.

## Running locally

Needs Node 22+ (see `.nvmrc`). No accounts or API keys.

```bash
npm install
npm run dev        # API on http://localhost:8787, web app on http://localhost:5173
```

Open http://localhost:5173. Data is synthetic and resets when the API restarts.

```bash
npm test           # 74 tests across contracts, core, ai, api and web
npm run typecheck
npm run build
```

| Package | What's in it |
|---|---|
| `packages/contracts` | Zod schemas shared by API and web: conversations, drafts, profile facts, requests, errors |
| `packages/core` | Draft lifecycle (exact-version edits, LinkedIn copy-only), policy (verified facts, opt-outs, grounding), waiting-on-me ordering |
| `packages/ai` | `DraftModel` adapter interface, prompt builder that treats messages as data, decision detector, deterministic fake model |
| `workers/api` | Cloudflare Worker (Hono): inbox, paste, generate, edit, copy, mark-sent; synthetic seed in memory |
| `apps/web` | React + Vite + Tailwind: inbox, paste form, reply panel |

## More of my agentic AI projects

| Project | What it is | Built with |
|---|---|---|
| **[Echo](https://github.com/Pranjal0211/echo)** (this repo) | AI communication twin: drafts job-search replies for Gmail and LinkedIn in my voice; nothing sends without my approval | React, TypeScript, Cloudflare Workers, Supabase, LLM adapter |
| **[agent-crew](https://github.com/Pranjal0211/agent-crew)** | My AI build crew: Claude Code agents (planner, builder, tester, designer) plus a `/round` team-lead skill that picks tasks, builds them, checks them in a real browser and opens PRs on other projects | Claude Code subagents, skills, Playwright |
| **[agent-office](https://github.com/Pranjal0211/agent-office)** | A virtual office where my AI agents work as employees: a live crew board showing who each agent is, what it's doing now, and what's next. Built and improved by agent-crew | HTML, CSS, JavaScript |
| Claude Agent SDK series | Hands-on learning series building agents with the Claude Agent SDK (in progress, not published yet) | TypeScript, Claude Agent SDK |

## License

[MIT](LICENSE) © 2026 Pranjal Sharma

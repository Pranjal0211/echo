# Echo — Claude Code instructions

@AGENTS.md

## Where things are
- Product spec: `docs/PRD.md` · Architecture: `docs/ARCHITECTURE.md` · Decisions: `docs/DECISIONS.md`
- Open review items: `docs/ROAST.md`, answered one at a time in `docs/GRILL.md`
- Work tickets: `docs/tasks/` · Concept mockups: `docs/assets/` (visual direction only; see ROAST R6 for what not to copy)

## Status
**Milestone 0 first slice is built**: paste → draft → edit → copy → mark sent, on synthetic in-memory data and the fake model.
Real drafts: Gemini adapter (ADR-019), on when `workers/api/.dev.vars` sets `ECHO_MODEL=gemini` and the owner's `GEMINI_API_KEY`. Tests always use the fake model and never call Gemini.
Milestone 1 storage: `ECHO_STORE=supabase` keeps data in a local Supabase (ADR-020; `npm run db:start`, `db:env`, `db:seed`). Sign-in waits until deploy.
Knowledge Base (FR-02, ADR-021): paste resume → model suggests facts (saved unverified) → owner approves; style notes and examples.
Next (Milestone 1): Outreach Studio, then Jobs/Contacts.

## Commands
- `npm run dev`: API (wrangler, :8787) + web (Vite, :5173)
- `npm test` · `npm run typecheck` · `npm run build`: run across all workspaces
- `npm run test:db`: store tests against the local Supabase (needs `npm run db:start`); they use their own ids and never touch the owner's profile
- CI (`.github/workflows/ci.yml`) runs typecheck, test and build on every PR; keep it green before asking for a merge

## Working with the owner
- Explain the plan in plain words and ask (with a recommendation) before building something new.
- Ask open questions one at a time.
- Commit author: Pranjal Sharma <pranjalsharma0211@gmail.com>.

## UI rules (from the original kit, still valid)
- Show the original message, draft, contact context, facts used and the channel together.
- LinkedIn drafts show **Copy for LinkedIn** / **Mark as sent manually**, never **Approve & Send**.
- Sending shows the recipient and attachment first.
- Keep `Generated`, `Approved`, `Attempted`, `Sent` and `Failed` visually distinct.
- Keyboard-operable, responsive, with empty, loading and error states.

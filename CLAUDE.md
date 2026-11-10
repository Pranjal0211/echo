# Echo — Claude Code instructions

@AGENTS.md

## Where things are
- Product spec: `docs/PRD.md` · Architecture: `docs/ARCHITECTURE.md` · Decisions: `docs/DECISIONS.md`
- Open review items: `docs/ROAST.md`, answered one at a time in `docs/GRILL.md`
- Work tickets: `docs/tasks/` · Concept mockups: `docs/assets/` (visual direction only; see ROAST R6 for what not to copy)

## Status
**Milestone 0 first slice is built**: paste → draft → edit → copy → mark sent, on synthetic in-memory data and the fake model.
Next (Milestone 1): Supabase storage and auth, Knowledge Base screen, Outreach Studio, and a real model adapter (ADR-013, needs the owner's API key).

## Commands
- `npm run dev`: API (wrangler, :8787) + web (Vite, :5173)
- `npm test` · `npm run typecheck` · `npm run build`: run across all workspaces

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

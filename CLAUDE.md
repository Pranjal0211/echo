# Claude Code handoff — ECHO

Read `ECHO_PRD.md` and `AGENTS.md` first. You are working on the **frontend UX slice**, in parallel with another agent who owns core contracts and database migrations.

## Your task
- Create a polished, responsive Echo dashboard with the screens: Overview, Inbox/Approvals (mocked initially), Outreach Studio, Jobs, Contacts, Knowledge Base, Daily Digest, Settings.
- **Start with Outreach Studio + Knowledge Base + Jobs/Contacts**; the other screens can initially be empty-state shells.
- Reference the three PNGs in `assets/` for visual direction, but improve readability and accessibility; mockup labels/figures are illustrative, not real data.
- Use seeded synthetic users, recruiters, jobs, and documents. Do not use private resumes or real accounts in source control.
- Make generation, edit, copy-to-LinkedIn, and approve states work with a fake API. **LinkedIn is copy-to-send only.** Real Gmail send must remain disabled.
- Use shared contracts from `packages/contracts` if present. If missing, draft an interface proposal without changing another agent's owned files.

## UX principles
- Clear original message, draft, contact context, factual evidence, and channel label.
- Never show `Approve & Send` for LinkedIn; show `Copy for LinkedIn` / `Mark as sent manually`.
- Sending actions must display recipient and attachment previews.
- Separate `Generated`, `Approved`, `Attempted`, `Sent`, and `Failed` states.
- Keyboard-operable controls, responsive layout and empty/error/loading states.

## Branch / PR
Use a focused `feat/echo-frontend-mvp` branch, atomic commits, screenshots from Playwright, and a PR summary including tests. Do not auto-merge.

# Echo AI Build Kit — START HERE

This kit is intended for ChatGPT, Codex, Claude Code and a human integrator to collaborate on the same product.

## Included files

- **ECHO_PRD.docx** — polished shareable Word version of the complete product requirements and implementation roadmap.
- **ECHO_PRD.md** — canonical machine-readable spec, including architecture, API, cost trade-offs, security, risks and reference mockups.
- **AGENTS.md** — cross-agent engineering constraints.
- **CLAUDE.md** — initial frontend implementation assignment.
- **agent_tasks/** — work tickets for parallel workstreams.
- **assets/** — three conceptual UI reference images. They depict proposed concepts, not a functioning application.

## Recommended startup

1. Create a private Git repository named `echo`.
2. Copy the **contents** of this kit into the repository root.
3. Ask Codex to complete `agent_tasks/01_contracts_and_db.md` on its own branch.
4. Ask Claude Code to complete `agent_tasks/02_frontend.md` on its own branch, with mocked data.
5. Review and merge the shared contract definitions before either agent wires real integrations.
6. Only after the mock flow works, start `agent_tasks/03_gmail_outbound.md`.

## Copy/paste prompt for Codex

> Read ECHO_PRD.md, AGENTS.md, and agent_tasks/01_contracts_and_db.md completely. Implement the scoped backend contracts and database migrations only. Use synthetic data and mock AI/provider calls. Work on a feature branch, commit atomically, and summarize test results. Do not touch the frontend or connect any real accounts.

## Copy/paste prompt for Claude Code

> Read ECHO_PRD.md, AGENTS.md, CLAUDE.md, and agent_tasks/02_frontend.md completely. Build the responsive Echo UI using synthetic mock data and the visual references in assets/. Focus on Knowledge Base + Outreach Studio + Jobs/Contacts, then add dashboard shells. Work on a feature branch, commit atomically, and include Playwright screenshots/tests. LinkedIn is copy-to-send; disable any real Gmail send.

## Integration rules

- One owner per file/feature at a time.
- Shared types/API routes are contract-first and reviewed.
- No secrets or real credentials in commits.
- Product decisions live in ECHO_PRD.md and docs/decisions.md.
- Humans approve OAuth scopes and all real emails.

## Caveat
The cost figures and API permissions were planned using publicly documented service capabilities around November 2026. Verify current pricing, quotas and app policies before connecting external accounts.

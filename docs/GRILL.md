# Grill — one question at a time

Each question resolves one item in `ROAST.md`. Answers are recorded here and applied to `PRD.md` / `DECISIONS.md`.
**2026-11-09:** the owner chose "use your recommendations" for every item.

| # | Roast item | Question | Claude's recommendation | Answer | Status |
|---|---|---|---|---|---|
| 1 | R1 | Should Milestone 1 also reply to a message you paste in, so Echo replaces the copy-into-ChatGPT step from the start? | Yes: option (b) | Use recommendation | Built in Milestone 0 |
| 2 | R2 | Add *waiting on me* status + age badge + oldest-first sort in Milestone 1? | Yes | Use recommendation | Built in Milestone 0 |
| 3 | R3 | Default drafting model: free Workers AI, or a strong hosted model (Claude) with a monthly cap? What cap? | Claude, $10/month cap to start | Use recommendation; changed 2026-11-10 to Gemini free tier | Superseded by ADR-019 (Gemini free tier). Needs the owner's Gemini API key |
| 4 | R4 | Use your style notes + 5–10 real sent messages in prompts from Milestone 1? Can you collect them? | Yes | Use recommendation | Accepted; prompt includes style notes and examples. Owner still to collect real examples |
| 5 | R5 | Adopt the four targets (0 over 48h, <24h median, <60s to draft, 70% light edits)? | Yes | Use recommendation | In PRD §2.4 |
| 6 | R6 | Apply the mockup fixes when building the UI? | Yes | Use recommendation | Built in Milestone 0 |
| 7 | R7 | Relabel FR-06 as "P0 — Milestone 2"? | Yes | Use recommendation | In PRD §5 |
| 8 | R8 | Milestone 0 ends with one working paste → draft → copy path on fake data, packages added only when needed? | Yes | Use recommendation | Built in Milestone 0 |
| 9 | R9 | OK with reconnecting Gmail about weekly (personal testing-mode app)? | Yes | Use recommendation | Accepted for Milestone 2 |
| 10 | R10 | Rank: tool, portfolio, product | Tool > portfolio > product | Use recommendation | Accepted |
| 11 | R11 | Keep LinkedIn copy assist in Milestone 1? | Yes | Use recommendation | Built in Milestone 0 |

## Also needed before building (not roast items)

- **Your sent-message examples** (for R4): collect 5–10 replies you were happy with. They go into the app's database, never the repo.
- **Facts Echo must never mention unless you add them per message:** visa/work authorization, current salary, notice period, reasons for leaving. Default: all "ask me every time".

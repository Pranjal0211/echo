# Grill — one question at a time

Each question resolves one item in `ROAST.md`. Claude asks them in order, in chat; answers are recorded here and applied to `PRD.md` / `DECISIONS.md`.
"Go with your recommendation" is always a valid answer.

| # | Roast item | Question | Claude's recommendation | Answer | Status |
|---|---|---|---|---|---|
| 1 | R1 | Should Milestone 1 also reply to a message you paste in, so Echo replaces the copy-into-ChatGPT step from the start? | Yes: option (b) | | Asked |
| 2 | R2 | Add *waiting on me* status + age badge + oldest-first sort in Milestone 1? | Yes | | |
| 3 | R3 | Default drafting model: free Workers AI, or a strong hosted model (Claude) with a monthly cap? What cap? | Claude, $10/month cap to start | | |
| 4 | R4 | Use your style notes + 5–10 real sent messages in prompts from Milestone 1? Can you collect them? | Yes | | |
| 5 | R5 | Adopt the four targets (0 over 48h, <24h median, <60s to draft, 70% light edits)? | Yes | | |
| 6 | R6 | Apply the mockup fixes when building the UI? | Yes | | |
| 7 | R7 | Relabel FR-06 as "P0 — Milestone 2"? | Yes | | |
| 8 | R8 | Milestone 0 ends with one working paste → draft → copy path on fake data, packages added only when needed? | Yes | | |
| 9 | R9 | OK with reconnecting Gmail about weekly (personal testing-mode app)? | Yes | | |
| 10 | R10 | Rank: tool, portfolio, product | Tool > portfolio > product | | |
| 11 | R11 | Keep LinkedIn copy assist in Milestone 1? | Yes | | |

## Also needed before building (not roast items)

- **Your sent-message examples** (for R4): collect 5–10 replies you were happy with. They go into the app's database, never the repo.
- **Facts Echo must never mention unless you add them per message:** visa/work authorization, current salary, notice period, reasons for leaving. Default: all "ask me every time".

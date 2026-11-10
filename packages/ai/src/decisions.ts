/**
 * Backend safety net: questions only the owner can answer. Applied to every draft,
 * whatever the model returned, so a weak model can't silently answer them.
 */
const RULES: ReadonlyArray<{ pattern: RegExp; question: string }> = [
  {
    pattern: /\b(availab\w*|free (?:this|next)|time to (?:chat|talk)|schedule|calendar|slot)\b/i,
    question: "When are you available? Echo won't pick times for you.",
  },
  {
    pattern: /\b(salary|compensation|pay range|expected (?:pay|ctc)|ctc|rate)\b/i,
    question: "Do you want to share salary expectations? If so, what range?",
  },
  {
    pattern: /\b(relocat\w*|on-?site|in office|in-office)\b/i,
    question: "Are you open to relocating or working on-site?",
  },
  {
    pattern: /\b(start date|notice period|when can you start|join by)\b/i,
    question: "What start date or notice period should Echo mention?",
  },
  {
    pattern: /\b(visa|sponsorship|work authori[sz]ation)\b/i,
    question: "Do you want to mention your work authorization?",
  },
];

export function detectDecisionsNeeded(text: string): string[] {
  return RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.question);
}

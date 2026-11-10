import type { ModelDraftOutput } from "@echo/contracts";
import { detectDecisionsNeeded } from "./decisions.ts";
import type { DraftContext, DraftModel } from "./model.ts";

const GREETING = { friendly_professional: "Hi", warm: "Hi", formal: "Dear", casual: "Hey" } as const;
const SIGN_OFF = { friendly_professional: "Best", warm: "Thanks so much", formal: "Best regards", casual: "Cheers" } as const;

const OPENERS: Record<DraftContext["intent"], string> = {
  interested: "Thanks for reaching out — this sounds like a great fit and I'd love to learn more.",
  need_details: "Thanks for thinking of me! Before we set anything up, could you share a bit more about the role, the team, and the next steps?",
  not_now: "Thank you for reaching out. The timing isn't right for me at the moment, but I'd be glad to stay in touch.",
  not_interested: "Thank you for thinking of me. I'm going to pass on this one, but I appreciate you reaching out.",
  thanks: "Thank you so much — I really appreciate it.",
  follow_up: "Just following up on my earlier message in case it got buried.",
  custom: "Thanks for your message.",
};

const PLACEHOLDER: Record<string, string> = {
  "When are you available? Echo won't pick times for you.": "I'm available [your availability].",
  "Do you want to share salary expectations? If so, what range?": "On compensation: [your answer].",
  "Are you open to relocating or working on-site?": "On location: [your preference].",
  "What start date or notice period should Echo mention?": "For timing: [your start date or notice period].",
  "Do you want to mention your work authorization?": "On work authorization: [your answer].",
};

/**
 * Deterministic stand-in for a real model: same input, same draft. Used in local
 * development and tests so nothing needs an API key or network.
 */
export class FakeDraftModel implements DraftModel {
  readonly modelId = "fake-draft-model-v1";

  async generateDraft(ctx: DraftContext): Promise<ModelDraftOutput> {
    const contactFirst = ctx.contact.name.split(" ")[0] ?? ctx.contact.name;
    const ownerFirst = ctx.profile.name.split(" ")[0] ?? ctx.profile.name;
    const lastInbound = [...ctx.conversation.messages].reverse().find((m) => m.direction === "inbound");
    const decisionsNeeded = lastInbound ? detectDecisionsNeeded(lastInbound.content) : [];

    const paragraphs: string[] = [OPENERS[ctx.intent]];
    const factIdsUsed: string[] = [];
    const leadFact = ctx.facts[0];
    if (leadFact && (ctx.intent === "interested" || ctx.intent === "need_details") && ctx.length !== "short") {
      paragraphs.push(`A bit about me: ${leadFact.text.charAt(0).toLowerCase()}${leadFact.text.slice(1)}.`);
      factIdsUsed.push(leadFact.id);
    }
    const placeholders = decisionsNeeded.map((q) => PLACEHOLDER[q]).filter((p): p is string => Boolean(p));
    if (placeholders.length > 0 && ctx.intent !== "not_interested") paragraphs.push(placeholders.join(" "));
    if (ctx.length === "long") paragraphs.push("Looking forward to hearing from you.");

    const body = [
      `${GREETING[ctx.tone]} ${contactFirst},`,
      ...paragraphs,
      `${SIGN_OFF[ctx.tone]},\n${ownerFirst}`,
    ].join("\n\n");

    const subject =
      ctx.channel === "gmail" ? `Re: ${ctx.conversation.subject ?? "Your message"}` : null;

    return { subject, body, factIdsUsed, warnings: [], decisionsNeeded };
  }
}

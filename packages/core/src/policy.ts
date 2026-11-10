import type { Contact, ModelDraftOutput, ProfileFact } from "@echo/contracts";
import { DomainError } from "./errors.ts";

/**
 * Facts the model may see: verified, and either non-sensitive or explicitly
 * opted in for this draft (salary, visa, notice period… are never used by default).
 */
export function selectUsableFacts(
  facts: readonly ProfileFact[],
  optedInFactIds: readonly string[] = [],
): ProfileFact[] {
  return facts.filter(
    (fact) =>
      fact.verified && (fact.sensitivity === "normal" || optedInFactIds.includes(fact.id)),
  );
}

/** Echo never drafts to someone who asked not to be contacted. */
export function assertCanDraftFor(contact: Contact): void {
  if (contact.optOut) {
    throw new DomainError("policy_blocked", `${contact.name} asked not to be contacted.`);
  }
}

/**
 * The backend, not the model, decides which facts a draft is grounded in.
 * Unknown fact ids are dropped and turned into a visible warning.
 */
export function enforceGrounding(
  output: ModelDraftOutput,
  usableFacts: readonly ProfileFact[],
): ModelDraftOutput {
  const allowed = new Set(usableFacts.map((fact) => fact.id));
  const grounded = output.factIdsUsed.filter((id) => allowed.has(id));
  const dropped = output.factIdsUsed.length - grounded.length;
  const warnings =
    dropped > 0
      ? [
          ...output.warnings,
          `The draft referenced ${dropped} fact(s) that aren't available for this draft. Check every claim before sending.`,
        ]
      : output.warnings;
  return { ...output, factIdsUsed: grounded, warnings };
}

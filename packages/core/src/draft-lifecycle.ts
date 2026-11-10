import type { Channel, DeliveryCapability, Draft, DraftStatus } from "@echo/contracts";
import { DomainError } from "./errors.ts";

/** Allowed status changes; mirrors the state machine in docs/ARCHITECTURE.md. */
const TRANSITIONS: Record<DraftStatus, readonly DraftStatus[]> = {
  generated: ["edited", "needs_approval", "rejected", "copied"],
  edited: ["edited", "needs_approval", "rejected", "copied"],
  needs_approval: ["edited", "approved", "rejected"],
  approved: ["needs_approval", "cancelled", "queued"],
  queued: ["sending"],
  sending: ["sent", "failed"],
  failed: ["queued"],
  copied: ["edited", "copied", "sent_manually"],
  sent: [],
  sent_manually: [],
  rejected: [],
  cancelled: [],
};

export function canTransition(from: DraftStatus, to: DraftStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Gmail can be sent by Echo (after approval); LinkedIn is always copied by the owner. */
export function deliveryCapabilityFor(channel: Channel): DeliveryCapability {
  return channel === "gmail" ? "provider_send" : "copy_only";
}

function assertVersion(draft: Draft, version: number): void {
  if (draft.version !== version) {
    throw new DomainError(
      "version_conflict",
      `Draft is at version ${draft.version}, not ${version}. Reload and review the latest text.`,
    );
  }
}

function moveTo(draft: Draft, to: DraftStatus, now: string, changes: Partial<Draft> = {}): Draft {
  if (!canTransition(draft.status, to)) {
    throw new DomainError("invalid_transition", `A ${draft.status} draft cannot become ${to}.`);
  }
  return { ...draft, ...changes, status: to, updatedAt: now };
}

/**
 * Editing always creates a new version. Editing an approved draft drops it back to
 * needs_approval, because approval covers one exact version.
 */
export function applyEdit(
  draft: Draft,
  edit: { body: string; subject?: string | null },
  expectedVersion: number,
  now: string,
): Draft {
  assertVersion(draft, expectedVersion);
  const to: DraftStatus = draft.status === "approved" ? "needs_approval" : "edited";
  return moveTo(draft, to, now, {
    body: edit.body,
    subject: edit.subject === undefined ? draft.subject : edit.subject,
    version: draft.version + 1,
  });
}

/** Record that the owner copied this exact version (copy-only channels). */
export function markCopied(draft: Draft, version: number, now: string): Draft {
  assertVersion(draft, version);
  if (draft.deliveryCapability !== "copy_only") {
    throw new DomainError("invalid_transition", "Only copy-only drafts are tracked as copied.");
  }
  return moveTo(draft, "copied", now);
}

/** The owner says they sent the copied text themselves. Echo never claims delivery on its own. */
export function markSentManually(draft: Draft, version: number, now: string): Draft {
  assertVersion(draft, version);
  return moveTo(draft, "sent_manually", now);
}

/** Approval for provider sending. Never possible for copy-only channels like LinkedIn. */
export function approveForSend(draft: Draft, version: number, now: string): Draft {
  assertVersion(draft, version);
  if (draft.deliveryCapability !== "provider_send") {
    throw new DomainError("policy_blocked", "LinkedIn drafts are copied, never sent by Echo.");
  }
  return moveTo(draft, "approved", now);
}

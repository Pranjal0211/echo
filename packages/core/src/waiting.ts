import type { Conversation } from "@echo/contracts";

const HOUR = 60 * 60 * 1000;

/** Threads waiting on me longer than this are overdue (PRD target: none over 48h). */
export const OVERDUE_AFTER_HOURS = 48;

export function waitingHours(since: string, now: Date): number {
  return Math.max(0, (now.getTime() - new Date(since).getTime()) / HOUR);
}

/** Short age label for badges: "now", "5h", "3d". */
export function formatWaitingAge(since: string, now: Date): string {
  const hours = waitingHours(since, now);
  if (hours < 1) return "now";
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function isOverdue(conversation: Conversation, now: Date): boolean {
  return (
    conversation.waitingOn === "me" &&
    conversation.waitingSince !== null &&
    waitingHours(conversation.waitingSince, now) >= OVERDUE_AFTER_HOURS
  );
}

const ORDER = { me: 0, them: 1, nobody: 2 } as const;

/** Inbox order: waiting on me first, oldest first; then waiting on them; then done. */
export function compareByWaiting(a: Conversation, b: Conversation): number {
  const byWho = ORDER[a.waitingOn] - ORDER[b.waitingOn];
  if (byWho !== 0) return byWho;
  const aSince = a.waitingSince ?? "9999";
  const bSince = b.waitingSince ?? "9999";
  return aSince.localeCompare(bSince);
}

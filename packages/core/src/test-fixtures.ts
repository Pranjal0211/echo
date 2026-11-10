import type { Draft } from "@echo/contracts";

export const T0 = "2026-11-01T09:00:00.000Z";

export function makeDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: "d1",
    conversationId: "c1",
    channel: "linkedin",
    deliveryCapability: "copy_only",
    intent: "interested",
    tone: "friendly_professional",
    length: "short",
    subject: null,
    body: "Hi Alex, thanks for reaching out!",
    version: 1,
    status: "generated",
    factIdsUsed: [],
    warnings: [],
    decisionsNeeded: [],
    modelId: "fake",
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

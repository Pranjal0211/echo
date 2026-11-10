import { describe, expect, it } from "vitest";
import type { Conversation } from "@echo/contracts";
import { compareByWaiting, formatWaitingAge, isOverdue } from "./waiting.ts";

const NOW = new Date("2026-11-05T12:00:00.000Z");

function convo(id: string, waitingOn: Conversation["waitingOn"], waitingSince: string | null): Conversation {
  return {
    id,
    channel: "gmail",
    contactId: "p1",
    subject: null,
    importSource: "pasted",
    waitingOn,
    waitingSince,
    messages: [{ id: "m1", direction: "inbound", content: "Hi", occurredAt: "2026-11-01T00:00:00.000Z" }],
  };
}

describe("formatWaitingAge", () => {
  it("formats minutes, hours and days", () => {
    expect(formatWaitingAge("2026-11-05T11:30:00.000Z", NOW)).toBe("now");
    expect(formatWaitingAge("2026-11-05T07:00:00.000Z", NOW)).toBe("5h");
    expect(formatWaitingAge("2026-11-02T12:00:00.000Z", NOW)).toBe("3d");
  });
});

describe("isOverdue", () => {
  it("flags threads waiting on me for 48h or more", () => {
    expect(isOverdue(convo("a", "me", "2026-11-03T12:00:00.000Z"), NOW)).toBe(true);
    expect(isOverdue(convo("b", "me", "2026-11-04T12:00:00.000Z"), NOW)).toBe(false);
  });

  it("never flags threads waiting on them", () => {
    expect(isOverdue(convo("c", "them", "2026-10-01T00:00:00.000Z"), NOW)).toBe(false);
  });
});

describe("compareByWaiting", () => {
  it("puts the oldest waiting-on-me thread first", () => {
    const sorted = [
      convo("done", "nobody", null),
      convo("them", "them", "2026-10-01T00:00:00.000Z"),
      convo("me-new", "me", "2026-11-05T00:00:00.000Z"),
      convo("me-old", "me", "2026-11-01T00:00:00.000Z"),
    ].sort(compareByWaiting);
    expect(sorted.map((c) => c.id)).toEqual(["me-old", "me-new", "them", "done"]);
  });
});

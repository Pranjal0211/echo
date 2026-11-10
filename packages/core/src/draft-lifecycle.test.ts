import { describe, expect, it } from "vitest";
import {
  applyEdit,
  approveForSend,
  canTransition,
  deliveryCapabilityFor,
  markCopied,
  markSentManually,
} from "./draft-lifecycle.ts";
import { DomainError } from "./errors.ts";
import { makeDraft, T0 } from "./test-fixtures.ts";

const LATER = "2026-11-01T10:00:00.000Z";

describe("deliveryCapabilityFor", () => {
  it("never lets Echo send on LinkedIn", () => {
    expect(deliveryCapabilityFor("linkedin")).toBe("copy_only");
    expect(deliveryCapabilityFor("gmail")).toBe("provider_send");
  });
});

describe("applyEdit", () => {
  it("creates a new version", () => {
    const edited = applyEdit(makeDraft(), { body: "Hi Alex!" }, 1, LATER);
    expect(edited).toMatchObject({ version: 2, status: "edited", body: "Hi Alex!", updatedAt: LATER });
  });

  it("rejects edits based on an old version", () => {
    const draft = makeDraft({ version: 3 });
    expect(() => applyEdit(draft, { body: "x" }, 2, LATER)).toThrowError(DomainError);
  });

  it("drops an approved draft back to needs_approval", () => {
    const approved = makeDraft({ channel: "gmail", deliveryCapability: "provider_send", status: "approved" });
    expect(applyEdit(approved, { body: "changed" }, 1, LATER).status).toBe("needs_approval");
  });

  it("refuses to edit something already sent", () => {
    const sent = makeDraft({ status: "sent_manually" });
    expect(() => applyEdit(sent, { body: "x" }, 1, LATER)).toThrowError(/cannot become/);
  });
});

describe("LinkedIn copy flow", () => {
  it("goes generated → copied → sent_manually", () => {
    const copied = markCopied(makeDraft(), 1, LATER);
    expect(copied.status).toBe("copied");
    expect(markSentManually(copied, 1, LATER).status).toBe("sent_manually");
  });

  it("cannot be marked sent before it was copied", () => {
    expect(() => markSentManually(makeDraft(), 1, T0)).toThrowError(/cannot become/);
  });

  it("can never be approved for sending", () => {
    expect(() => approveForSend(makeDraft(), 1, T0)).toThrowError(/never sent by Echo/);
  });
});

describe("canTransition", () => {
  it("treats sent states as final", () => {
    expect(canTransition("sent", "edited")).toBe(false);
    expect(canTransition("sent_manually", "copied")).toBe(false);
  });
});

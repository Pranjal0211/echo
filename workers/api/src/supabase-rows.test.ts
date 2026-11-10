import { describe, expect, it } from "vitest";
import type { Draft } from "@echo/contracts";
import {
  type ConversationRow,
  type DraftRow,
  contactFromRow,
  contactToRow,
  conversationFromRows,
  conversationToArgs,
  draftFromRow,
  draftToRow,
  isoTime,
  OWNER_PROFILE_ID,
  profileFromRows,
  profileToArgs,
} from "./supabase-rows.ts";
import { buildSeed } from "./seed.ts";

const seed = buildSeed(new Date("2026-11-10T12:00:00.000Z"));

describe("isoTime", () => {
  it("turns Postgres offsets into the ISO form the contracts expect", () => {
    expect(isoTime("2026-11-10 09:00:00+00")).toBe("2026-11-10T09:00:00.000Z");
    expect(isoTime("2026-11-10T14:30:00+05:30")).toBe("2026-11-10T09:00:00.000Z");
  });

  it("rejects a value that isn't a time", () => {
    expect(() => isoTime("not a time")).toThrow(/Invalid timestamp/);
  });
});

describe("profile rows", () => {
  it("rebuilds the profile with facts and examples in saved order", () => {
    const args = profileToArgs(seed.profile);
    expect(args.p_profile.id).toBe(OWNER_PROFILE_ID);
    const facts = args.p_facts.map((f, position) => ({ ...f, position })).reverse();
    const examples = args.p_examples.map((e, position) => ({ ...e, position })).reverse();
    expect(profileFromRows({ ...args.p_profile }, facts, examples)).toEqual(seed.profile);
  });

  it("uses the given profile id, so tests never write the owner's profile", () => {
    expect(profileToArgs(seed.profile, "test-profile").p_profile.id).toBe("test-profile");
  });
});

describe("contact rows", () => {
  it("round-trips every seeded contact", () => {
    for (const contact of seed.contacts) expect(contactFromRow(contactToRow(contact))).toEqual(contact);
  });
});

describe("conversation rows", () => {
  it("round-trips a conversation and sorts messages by time", () => {
    const conversation = seed.conversations[0]!;
    const { p_conversation, p_messages } = conversationToArgs(conversation);
    expect(conversationFromRows(p_conversation, [...p_messages].reverse())).toEqual(conversation);
  });

  it("fails loudly when a row doesn't match the contract", () => {
    const { p_conversation, p_messages } = conversationToArgs(seed.conversations[0]!);
    const drifted = { ...p_conversation, channel: "slack" } as unknown as ConversationRow;
    expect(() => conversationFromRows(drifted, p_messages)).toThrow();
    expect(() => conversationFromRows(p_conversation, [])).toThrow();
  });
});

describe("draft rows", () => {
  const draft: Draft = {
    id: "d1",
    conversationId: "c1",
    channel: "gmail",
    deliveryCapability: "provider_send",
    intent: "interested",
    tone: "warm",
    length: "short",
    subject: "Re: hello",
    body: "Thanks!",
    version: 2,
    status: "edited",
    factIdsUsed: ["fact-react"],
    warnings: ["Unverified fact removed"],
    decisionsNeeded: [],
    modelId: "gemini-3.5-flash-lite",
    createdAt: "2026-11-10T09:00:00.000Z",
    updatedAt: "2026-11-10T09:05:00.000Z",
  };

  it("round-trips a draft, normalising database timestamps", () => {
    const row: DraftRow = { ...draftToRow(draft), created_at: "2026-11-10 09:00:00+00", updated_at: "2026-11-10 09:05:00+00" };
    expect(draftFromRow(row)).toEqual(draft);
  });

  it("rejects a LinkedIn row that claims provider sending", () => {
    const row: DraftRow = { ...draftToRow(draft), channel: "linkedin" };
    expect(() => draftFromRow(row)).toThrow();
  });
});

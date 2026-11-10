import { describe, expect, it } from "vitest";
import { Contact, Conversation, Profile } from "@echo/contracts";
import { buildSeed } from "./seed.ts";
import { InMemoryStore } from "./store.ts";

const NOW = new Date("2026-11-09T12:00:00.000Z");

describe("synthetic seed", () => {
  const seed = buildSeed(NOW);

  it("matches the shared contracts", () => {
    expect(() => Profile.parse(seed.profile)).not.toThrow();
    for (const c of seed.contacts) expect(() => Contact.parse(c)).not.toThrow();
    for (const c of seed.conversations) expect(() => Conversation.parse(c)).not.toThrow();
  });

  it("uses only example.com addresses", () => {
    for (const c of seed.contacts) {
      if (c.verifiedEmail) expect(c.verifiedEmail).toMatch(/@example\.com$/);
    }
  });

  it("references contacts that exist", () => {
    const ids = new Set(seed.contacts.map((c) => c.id));
    for (const c of seed.conversations) expect(ids.has(c.contactId)).toBe(true);
  });
});

describe("InMemoryStore", () => {
  it("returns copies, so callers can't mutate stored data", async () => {
    const store = new InMemoryStore(buildSeed(NOW));
    const convo = (await store.getConversation("convo-alex"))!;
    convo.waitingOn = "nobody";
    expect((await store.getConversation("convo-alex"))!.waitingOn).toBe("me");
  });
});

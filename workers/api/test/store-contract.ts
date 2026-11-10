import { beforeAll, describe, expect, it } from "vitest";
import type { Contact, Conversation, Draft, Profile } from "@echo/contracts";
import type { EchoStore } from "../src/store.ts";

/**
 * Behaviour every EchoStore must have. Runs against memory in every test run and against
 * the local Supabase with `npm run test:db`. Ids carry a per-run prefix so the database
 * run never collides with, or changes, the owner's own rows.
 */
export function describeStoreContract(name: string, setup: () => Promise<{ store: EchoStore; prefix: string }>) {
  describe(`${name} store contract`, () => {
    let store: EchoStore;
    let id: (suffix: string) => string;

    beforeAll(async () => {
      const ctx = await setup();
      store = ctx.store;
      id = (suffix) => `${ctx.prefix}-${suffix}`;
    });

    const contact = (): Contact => ({
      id: id("contact"),
      name: "Test Person",
      company: "Example Co",
      role: null,
      relationship: "recruiter",
      verifiedEmail: "test.person@example.com",
      linkedinUrl: null,
      optOut: false,
    });

    const conversation = (): Conversation => ({
      id: id("convo"),
      channel: "linkedin",
      contactId: id("contact"),
      subject: null,
      importSource: "pasted",
      waitingOn: "me",
      waitingSince: "2026-11-10T08:00:00.000Z",
      messages: [{ id: id("msg-1"), direction: "inbound", content: "Hi, open to a chat?", occurredAt: "2026-11-10T08:00:00.000Z" }],
    });

    const draft = (overrides: Partial<Draft> = {}): Draft => ({
      id: id("draft-1"),
      conversationId: id("convo"),
      channel: "linkedin",
      deliveryCapability: "copy_only",
      intent: "interested",
      tone: "warm",
      length: "short",
      subject: null,
      body: "Thanks, happy to chat.",
      version: 1,
      status: "generated",
      factIdsUsed: ["fact-a"],
      warnings: [],
      decisionsNeeded: ["What salary range should I share?"],
      modelId: "fake-v1",
      createdAt: "2026-11-10T09:00:00.000Z",
      updatedAt: "2026-11-10T09:00:00.000Z",
      ...overrides,
    });

    it("saves a profile and reads it back with facts and examples in order", async () => {
      const profile: Profile = {
        name: "Test Owner",
        headline: "Engineer",
        styleNotes: ["Short", "Warm"],
        facts: [
          { id: id("fact-b"), text: "Second written first", category: "skill", verified: true, sensitivity: "normal" },
          { id: id("fact-a"), text: "Salary is private", category: "preference", verified: true, sensitivity: "ask_every_time" },
        ],
        styleExamples: [{ id: id("ex-1"), situation: "Recruiter reply", text: "Thanks for reaching out!" }],
      };
      await store.saveProfile(profile);
      expect(await store.getProfile()).toEqual(profile);

      const edited = { ...profile, facts: [profile.facts[1]!], styleExamples: [] };
      await store.saveProfile(edited);
      expect(await store.getProfile()).toEqual(edited);
    });

    it("saves and reads a contact, and returns null for an unknown one", async () => {
      await store.saveContact(contact());
      expect(await store.getContact(id("contact"))).toEqual(contact());
      expect(await store.getContact(id("missing"))).toBeNull();
    });

    it("saves a conversation, then appends a reply and updates who is waiting", async () => {
      await store.saveContact(contact());
      await store.saveConversation(conversation());
      expect(await store.getConversation(id("convo"))).toEqual(conversation());

      const replied = conversation();
      replied.messages.push({ id: id("msg-2"), direction: "outbound", content: "Sure!", occurredAt: "2026-11-10T10:00:00.000Z" });
      replied.waitingOn = "them";
      replied.waitingSince = "2026-11-10T10:00:00.000Z";
      await store.saveConversation(replied);

      expect(await store.getConversation(id("convo"))).toEqual(replied);
      expect((await store.listConversations()).find((c) => c.id === id("convo"))).toEqual(replied);
      expect(await store.getConversation(id("missing"))).toBeNull();
    });

    it("saves drafts, overwrites a draft with its new version, and finds the latest", async () => {
      await store.saveContact(contact());
      await store.saveConversation(conversation());
      expect(await store.latestDraftFor(id("convo"))).toBeNull();

      await store.saveDraft(draft());
      const edited = draft({ body: "Edited text.", version: 2, status: "edited", updatedAt: "2026-11-10T09:05:00.000Z" });
      await store.saveDraft(edited);
      expect(await store.getDraft(id("draft-1"))).toEqual(edited);

      const newer = draft({ id: id("draft-2"), createdAt: "2026-11-10T11:00:00.000Z", updatedAt: "2026-11-10T11:00:00.000Z" });
      await store.saveDraft(newer);
      expect(await store.latestDraftFor(id("convo"))).toEqual(newer);
      expect(await store.getDraft(id("missing"))).toBeNull();
    });
  });
}

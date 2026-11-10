import { describe, expect, it } from "vitest";
import type { DraftModel } from "@echo/ai";
import { DraftResponse, InboxResponse } from "@echo/contracts";
import { createApp } from "./app.ts";
import { buildSeed } from "./seed.ts";
import { InMemoryStore } from "./store.ts";
import { makeTestApp, TEST_NOW } from "./test-app.ts";

const generate = (conversationId: string, extra: Record<string, unknown> = {}) => ({
  conversationId,
  intent: "interested",
  tone: "friendly_professional",
  length: "medium",
  ...extra,
});

async function draftFrom(res: Response) {
  return DraftResponse.parse(await res.json()).draft;
}

describe("POST /api/drafts/generate", () => {
  it("drafts a LinkedIn reply as copy-only, grounded in verified facts", async () => {
    const { json } = makeTestApp();
    const res = await json("/api/drafts/generate", "POST", generate("convo-sam"));
    expect(res.status).toBe(201);
    const draft = await draftFrom(res);
    expect(draft).toMatchObject({
      channel: "linkedin",
      deliveryCapability: "copy_only",
      status: "generated",
      version: 1,
      subject: null,
      modelId: "fake-draft-model-v1",
    });
    expect(draft.body).toMatch(/^Hi Sam,/);
    expect(draft.factIdsUsed).toEqual(["fact-react"]);
  });

  it("never hands the model unverified or sensitive facts", async () => {
    const seen: string[][] = [];
    const spy: DraftModel = {
      modelId: "spy",
      async generateDraft(ctx) {
        seen.push(ctx.facts.map((f) => f.id));
        return { subject: null, body: "Hi", factIdsUsed: ["fact-rust", "fact-visa"], warnings: [], decisionsNeeded: [] };
      },
    };
    const app = createApp({ store: new InMemoryStore(buildSeed(TEST_NOW)), model: spy, now: () => TEST_NOW, newId: () => "d" });
    const res = await app.request("/api/drafts/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(generate("convo-sam")),
    });
    const draft = await draftFrom(res);
    expect(seen[0]).not.toContain("fact-rust");
    expect(seen[0]).not.toContain("fact-visa");
    expect(draft.factIdsUsed).toEqual([]);
    expect(draft.warnings).toHaveLength(1);
  });

  it("flags salary and relocation as the owner's decisions, even if the model doesn't", async () => {
    const { json } = makeTestApp();
    const draft = await draftFrom(await json("/api/drafts/generate", "POST", generate("convo-priya")));
    expect(draft.decisionsNeeded.join(" ")).toMatch(/salary/i);
    expect(draft.decisionsNeeded.join(" ")).toMatch(/relocat/i);
  });

  it("gives Gmail drafts a Re: subject and send capability", async () => {
    const { json } = makeTestApp();
    const draft = await draftFrom(await json("/api/drafts/generate", "POST", generate("convo-alex")));
    expect(draft.deliveryCapability).toBe("provider_send");
    expect(draft.subject).toBe("Re: Frontend Engineer opportunity at Northwind Labs");
  });

  it("returns 502 when the model returns junk", async () => {
    const broken: DraftModel = {
      modelId: "broken",
      async generateDraft() {
        return { body: "" } as never;
      },
    };
    const app = createApp({ store: new InMemoryStore(buildSeed(TEST_NOW)), model: broken, now: () => TEST_NOW, newId: () => "d" });
    const res = await app.request("/api/drafts/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(generate("convo-sam")),
    });
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: { code: "model_error" } });
  });

  it("refuses to draft to an opted-out contact", async () => {
    const { json, store } = makeTestApp();
    const sam = (await store.getContact("contact-sam"))!;
    await store.saveContact({ ...sam, optOut: true });
    const res = await json("/api/drafts/generate", "POST", generate("convo-sam"));
    expect(res.status).toBe(403);
  });

  it("404s for an unknown conversation", async () => {
    const { json } = makeTestApp();
    expect((await json("/api/drafts/generate", "POST", generate("nope"))).status).toBe(404);
  });
});

describe("edit → copy → mark sent", () => {
  it("runs the full LinkedIn flow and moves the thread to waiting on them", async () => {
    const { app, json } = makeTestApp();
    const created = await draftFrom(await json("/api/drafts/generate", "POST", generate("convo-sam")));

    const edited = await draftFrom(
      await json(`/api/drafts/${created.id}`, "PATCH", { body: "Hey Sam, yes please! Resume attached. Jordan", expectedVersion: 1 }),
    );
    expect(edited).toMatchObject({ version: 2, status: "edited" });

    const copied = await draftFrom(await json(`/api/drafts/${created.id}/copy`, "POST", { version: 2 }));
    expect(copied.status).toBe("copied");

    const sent = await draftFrom(await json(`/api/drafts/${created.id}/mark-sent`, "POST", { version: 2 }));
    expect(sent.status).toBe("sent_manually");

    const inbox = InboxResponse.parse(await (await app.request("/api/inbox")).json());
    const sam = inbox.items.find((i) => i.conversation.id === "convo-sam")!;
    expect(sam.conversation.waitingOn).toBe("them");
    expect(sam.conversation.messages.at(-1)).toMatchObject({ direction: "outbound", content: edited.body });
    expect(sam.latestDraft?.status).toBe("sent_manually");
  });

  it("409s when editing a stale version", async () => {
    const { json } = makeTestApp();
    const created = await draftFrom(await json("/api/drafts/generate", "POST", generate("convo-sam")));
    await json(`/api/drafts/${created.id}`, "PATCH", { body: "v2", expectedVersion: 1 });
    const stale = await json(`/api/drafts/${created.id}`, "PATCH", { body: "also v2?", expectedVersion: 1 });
    expect(stale.status).toBe(409);
  });

  it("won't mark a Gmail draft as copied (it's sent through Gmail after approval)", async () => {
    const { json } = makeTestApp();
    const created = await draftFrom(await json("/api/drafts/generate", "POST", generate("convo-alex")));
    expect((await json(`/api/drafts/${created.id}/copy`, "POST", { version: 1 })).status).toBe(409);
  });
});

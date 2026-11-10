import { type DraftModel, FakeDraftModel } from "@echo/ai";
import { DraftResponse } from "@echo/contracts";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";
import { buildSeed } from "./seed.ts";
import { InMemoryStore } from "./store.ts";
import { TEST_NOW } from "./test-app.ts";

/** A model that behaves like a real one on a bad day: ids in the body, partial questions, a fallback. */
const messyModel: DraftModel = {
  modelId: "main-model",
  async generateDraft() {
    return {
      subject: null,
      body: "Hi Priya,\n\nI've built React apps for years [fact-react].\n\nOn pay: [your salary range].\n\nJordan",
      factIdsUsed: ["fact-react"],
      warnings: [],
      decisionsNeeded: ["What are your salary expectations?"],
      modelId: "fallback-model",
    };
  },
};

async function draftForPriya() {
  const app = createApp({ store: new InMemoryStore(buildSeed(TEST_NOW)), model: messyModel, suggester: new FakeDraftModel(), now: () => TEST_NOW, newId: () => "d1" });
  const res = await app.request("/api/drafts/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ conversationId: "convo-priya", intent: "interested", tone: "friendly_professional", length: "medium" }),
  });
  expect(res.status).toBe(201);
  return DraftResponse.parse(await res.json()).draft;
}

describe("cleaning up model output", () => {
  it("removes fact-id citations from the body but keeps owner placeholders", async () => {
    const draft = await draftForPriya();
    expect(draft.body).toContain("I've built React apps for years.");
    expect(draft.body).not.toContain("[fact-react]");
    expect(draft.body).toContain("[your salary range]");
  });

  it("asks about each topic once, adding only what the model missed", async () => {
    const draft = await draftForPriya();
    expect(draft.decisionsNeeded).toEqual([
      "What are your salary expectations?",
      "Are you open to relocating or working on-site?",
    ]);
  });

  it("records the model that actually wrote the draft", async () => {
    expect((await draftForPriya()).modelId).toBe("fallback-model");
  });
});

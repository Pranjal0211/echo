import { type DraftModel, FakeDraftModel, ModelUnavailableError, type ModelUnavailableReason } from "@echo/ai";
import { InboxResponse } from "@echo/contracts";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";
import { buildSeed } from "./seed.ts";
import { InMemoryStore } from "./store.ts";
import { TEST_NOW } from "./test-app.ts";

function appWithFailingModel(reason: ModelUnavailableReason, message: string) {
  const model: DraftModel = {
    modelId: "failing",
    async generateDraft() {
      throw new ModelUnavailableError(reason, message);
    },
  };
  return createApp({ store: new InMemoryStore(buildSeed(TEST_NOW)), model, suggester: new FakeDraftModel(), now: () => TEST_NOW, newId: () => "d" });
}

const generate = (app: ReturnType<typeof createApp>) =>
  app.request("/api/drafts/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ conversationId: "convo-sam", intent: "interested", tone: "friendly_professional", length: "medium" }),
  });

describe("model provider errors", () => {
  it("returns 429 with the provider's guidance when rate limited", async () => {
    const res = await generate(appWithFailingModel("rate_limited", "Wait a minute and try again."));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: { code: "model_error", message: "Wait a minute and try again." } });
  });

  it.each(["auth", "not_configured", "unavailable"] as const)("returns 503 for %s", async (reason) => {
    const res = await generate(appWithFailingModel(reason, "Check GEMINI_API_KEY."));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: { code: "model_error", message: "Check GEMINI_API_KEY." } });
  });

  it("saves no draft when the model fails", async () => {
    const app = appWithFailingModel("unavailable", "down");
    await generate(app);
    const inbox = InboxResponse.parse(await (await app.request("/api/inbox")).json());
    const sam = inbox.items.find((i) => i.conversation.id === "convo-sam");
    expect(sam?.latestDraft).toBeNull();
  });
});

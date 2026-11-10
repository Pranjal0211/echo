import { describe, expect, it } from "vitest";
import { GEMINI_DEFAULT_MODEL, GeminiDraftModel } from "./gemini-model.ts";
import { ModelOutputError, ModelUnavailableError } from "./model.ts";
import { makeContext } from "./test-context.ts";

const DRAFT = {
  subject: null,
  body: "Hi Alex,\n\nThanks for reaching out.\n\nJordan",
  factIdsUsed: ["f1"],
  warnings: [],
  decisionsNeeded: [],
};

function interaction(text: string, status = "completed") {
  return { id: "i1", status, steps: [{ type: "model_output", content: [{ type: "text", text }] }] };
}

/** A fetch stand-in that records the request and answers with `body` and `status`. */
function fakeFetch(body: unknown, status = 200) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  return { fn, calls };
}

describe("GeminiDraftModel", () => {
  it("sends the prompt with the key in a header, no storage and a JSON schema", async () => {
    const { fn, calls } = fakeFetch(interaction(JSON.stringify(DRAFT)));
    const model = new GeminiDraftModel({ apiKey: "test-key", fetch: fn });

    await model.generateDraft(makeContext());

    expect(model.modelId).toBe(GEMINI_DEFAULT_MODEL);
    const [call] = calls;
    expect(call?.url).toBe("https://generativelanguage.googleapis.com/v1beta/interactions");
    expect(call?.url).not.toContain("test-key");
    expect((call?.init.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-key");
    const body = JSON.parse(String(call?.init.body));
    expect(body.model).toBe(GEMINI_DEFAULT_MODEL);
    expect(body.store).toBe(false);
    expect(body.system_instruction).toContain("Only state facts");
    expect(body.input).toContain("<conversation");
    expect(body.response_format.mime_type).toBe("application/json");
    expect(body.response_format.schema.required).toContain("decisionsNeeded");
  });

  it("returns the validated draft from the last model output", async () => {
    const { fn } = fakeFetch(interaction(JSON.stringify(DRAFT)));
    const draft = await new GeminiDraftModel({ apiKey: "k", model: "gemini-x", fetch: fn }).generateDraft(makeContext());
    expect(draft).toEqual({ ...DRAFT, modelId: "gemini-x" });
  });

  it.each([
    [429, "rate_limited"],
    [401, "auth"],
    [403, "auth"],
    [404, "not_configured"],
    [500, "unavailable"],
  ])("maps HTTP %i to %s", async (status, reason) => {
    const { fn } = fakeFetch({ error: { message: "nope" } }, status);
    const result = new GeminiDraftModel({ apiKey: "k", fetch: fn }).generateDraft(makeContext());
    await expect(result).rejects.toBeInstanceOf(ModelUnavailableError);
    await expect(result).rejects.toMatchObject({ reason });
  });

  it("falls back to the next model when the first is overloaded and says which one drafted", async () => {
    const models: string[] = [];
    const fn = (async (_url: string, init: RequestInit) => {
      const { model } = JSON.parse(String(init.body));
      models.push(model);
      return model === "busy-model"
        ? new Response(JSON.stringify({ error: { code: "service_unavailable" } }), { status: 503 })
        : new Response(JSON.stringify(interaction(JSON.stringify(DRAFT))), { status: 200 });
    }) as unknown as typeof fetch;
    const result = await new GeminiDraftModel({
      apiKey: "k",
      model: "busy-model",
      fallbackModels: ["lite-model"],
      fetch: fn,
    }).generateDraft(makeContext());
    expect(models).toEqual(["busy-model", "lite-model"]);
    expect(result.modelId).toBe("lite-model");
  });

  it("does not fall back on a bad key", async () => {
    const { fn, calls } = fakeFetch({ error: {} }, 401);
    const result = new GeminiDraftModel({ apiKey: "k", fallbackModels: ["lite-model"], fetch: fn }).generateDraft(makeContext());
    await expect(result).rejects.toMatchObject({ reason: "auth" });
    expect(calls).toHaveLength(1);
  });

  it("reports a network failure as unavailable", async () => {
    const fn = (async () => {
      throw new TypeError("network down");
    }) as unknown as typeof fetch;
    await expect(new GeminiDraftModel({ apiKey: "k", fetch: fn }).generateDraft(makeContext())).rejects.toMatchObject({
      reason: "unavailable",
    });
  });

  it("rejects a response that isn't JSON", async () => {
    const fn = (async () => new Response("<html>Service error</html>", { status: 200 })) as unknown as typeof fetch;
    await expect(new GeminiDraftModel({ apiKey: "k", fetch: fn }).generateDraft(makeContext())).rejects.toThrow(
      "Gemini returned invalid JSON.",
    );
  });

  it("rejects truncated, empty or invalid output", async () => {
    for (const body of [
      interaction(JSON.stringify(DRAFT), "incomplete"),
      { status: "completed", steps: [] },
      interaction('{"body": ""}'),
    ]) {
      const { fn } = fakeFetch(body);
      await expect(new GeminiDraftModel({ apiKey: "k", fetch: fn }).generateDraft(makeContext())).rejects.toBeInstanceOf(
        ModelOutputError,
      );
    }
  });
});

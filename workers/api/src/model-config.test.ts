import { FakeDraftModel, GeminiDraftModel, ModelUnavailableError } from "@echo/ai";
import { describe, expect, it } from "vitest";
import { createModel } from "./model-config.ts";

describe("createModel", () => {
  it("uses the fake model unless ECHO_MODEL is gemini", () => {
    expect(createModel({})).toBeInstanceOf(FakeDraftModel);
    expect(createModel({ ECHO_MODEL: "fake", GEMINI_API_KEY: "k" })).toBeInstanceOf(FakeDraftModel);
  });

  it("uses Gemini with the configured model when a key is set", () => {
    const model = createModel({ ECHO_MODEL: "gemini", GEMINI_API_KEY: "k", GEMINI_MODEL: "gemini-3.5-flash-lite" });
    expect(model).toBeInstanceOf(GeminiDraftModel);
    expect(model.modelId).toBe("gemini-3.5-flash-lite");
  });

  it("explains a missing key when a draft is requested", async () => {
    const model = createModel({ ECHO_MODEL: "gemini", GEMINI_API_KEY: "  " });
    await expect(model.generateDraft({} as never)).rejects.toBeInstanceOf(ModelUnavailableError);
    await expect(model.generateDraft({} as never)).rejects.toThrow(/GEMINI_API_KEY/);
  });
});

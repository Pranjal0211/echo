import { describe, expect, it } from "vitest";
import { detectDecisionsNeeded, missingDecisions } from "./decisions.ts";

describe("missingDecisions", () => {
  const message = "What are your salary expectations, and are you open to relocating to Boston?";

  it("skips topics the model already asked about", () => {
    expect(missingDecisions(message, ["What are your salary expectations?"])).toEqual([
      "Are you open to relocating or working on-site?",
    ]);
  });

  it("adds every detected topic when the model asked nothing", () => {
    expect(missingDecisions(message, [])).toEqual(detectDecisionsNeeded(message));
  });
});

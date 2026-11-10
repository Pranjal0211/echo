import { describe, expect, it } from "vitest";
import { stripFactIds } from "./body-cleanup.ts";

describe("stripFactIds", () => {
  const ids = ["fact-react", "fact-design-system"];

  it("removes single and grouped fact-id citations", () => {
    expect(stripFactIds("Four years of React [fact-react].", ids)).toBe("Four years of React.");
    expect(stripFactIds("I build UIs [fact-react, fact-design-system] daily.", ids)).toBe("I build UIs daily.");
  });

  it("keeps owner placeholders and unknown brackets", () => {
    expect(stripFactIds("My range is [your salary range].", ids)).toBe("My range is [your salary range].");
    expect(stripFactIds("See [notes].", ids)).toBe("See [notes].");
  });

  it("does nothing without facts", () => {
    expect(stripFactIds("Hi [fact-react]", [])).toBe("Hi [fact-react]");
  });
});

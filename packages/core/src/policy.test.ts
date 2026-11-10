import { describe, expect, it } from "vitest";
import type { Contact, ProfileFact } from "@echo/contracts";
import { assertCanDraftFor, enforceGrounding, selectUsableFacts } from "./policy.ts";

const facts: ProfileFact[] = [
  { id: "f1", text: "4 years of React", category: "experience", verified: true, sensitivity: "normal" },
  { id: "f2", text: "Built a Playwright suite", category: "project", verified: false, sensitivity: "normal" },
  { id: "f3", text: "Needs visa sponsorship", category: "other", verified: true, sensitivity: "ask_every_time" },
];

describe("selectUsableFacts", () => {
  it("keeps only verified, non-sensitive facts by default", () => {
    expect(selectUsableFacts(facts).map((f) => f.id)).toEqual(["f1"]);
  });

  it("includes a sensitive fact only when opted in", () => {
    expect(selectUsableFacts(facts, ["f3"]).map((f) => f.id)).toEqual(["f1", "f3"]);
  });

  it("never includes unverified facts, even if opted in", () => {
    expect(selectUsableFacts(facts, ["f2"]).map((f) => f.id)).toEqual(["f1"]);
  });
});

describe("assertCanDraftFor", () => {
  const contact: Contact = {
    id: "p1",
    name: "Sam Lee",
    company: null,
    role: null,
    relationship: "recruiter",
    verifiedEmail: null,
    linkedinUrl: null,
    optOut: true,
  };

  it("blocks opted-out contacts", () => {
    expect(() => assertCanDraftFor(contact)).toThrowError(/asked not to be contacted/);
  });
});

describe("enforceGrounding", () => {
  it("drops fact ids the model was not given and warns", () => {
    const result = enforceGrounding(
      {
        subject: null,
        body: "Hi",
        factIdsUsed: ["f1", "f2", "f3", "made-up"],
        warnings: [],
        decisionsNeeded: [],
      },
      selectUsableFacts(facts),
    );
    expect(result.factIdsUsed).toEqual(["f1"]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("aren't available for this draft");
  });

  it("leaves grounded output untouched", () => {
    const output = { subject: null, body: "Hi", factIdsUsed: ["f1"], warnings: [], decisionsNeeded: [] };
    expect(enforceGrounding(output, selectUsableFacts(facts))).toEqual(output);
  });
});

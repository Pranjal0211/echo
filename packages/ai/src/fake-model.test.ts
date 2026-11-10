import { describe, expect, it } from "vitest";
import { ModelDraftOutput } from "@echo/contracts";
import { detectDecisionsNeeded } from "./decisions.ts";
import { FakeDraftModel } from "./fake-model.ts";
import { makeContext } from "./test-context.ts";

const model = new FakeDraftModel();

describe("FakeDraftModel", () => {
  it("returns valid, deterministic output", async () => {
    const a = await model.generateDraft(makeContext());
    const b = await model.generateDraft(makeContext());
    expect(ModelDraftOutput.parse(a)).toEqual(b);
  });

  it("greets the contact, signs as the owner and cites the fact it used", async () => {
    const draft = await model.generateDraft(makeContext());
    expect(draft.body).toMatch(/^Hi Alex,/);
    expect(draft.body).toMatch(/Jordan$/);
    expect(draft.factIdsUsed).toEqual(["f1"]);
    expect(draft.subject).toBeNull();
  });

  it("leaves availability to the owner", async () => {
    const ctx = makeContext();
    ctx.conversation.messages[0]!.content = "Are you available for a call this week?";
    const draft = await model.generateDraft(ctx);
    expect(draft.body).toContain("[your availability]");
    expect(draft.decisionsNeeded).toHaveLength(1);
  });

  it("adds a placeholder for every owner-only decision", async () => {
    const ctx = makeContext();
    ctx.conversation.messages[0]!.content =
      "Are you available? Are you open to relocating? What is your start date? Do you need visa sponsorship? What are your salary expectations?";
    const draft = await model.generateDraft(ctx);
    expect(draft.decisionsNeeded).toHaveLength(5);
    expect(draft.body).toContain("[your availability]");
    expect(draft.body).toContain("[your preference]");
    expect(draft.body).toContain("[your start date or notice period]");
    expect(draft.body).toContain("On work authorization: [your answer].");
    expect(draft.body).toContain("On compensation: [your answer].");
  });

  it("uses a Re: subject for Gmail", async () => {
    const ctx = makeContext({ channel: "gmail" });
    ctx.conversation.subject = "Frontend role";
    expect((await model.generateDraft(ctx)).subject).toBe("Re: Frontend role");
  });
});

describe("detectDecisionsNeeded", () => {
  it("spots salary, relocation and visa questions", () => {
    const found = detectDecisionsNeeded("What are your salary expectations? Can you relocate? Need visa sponsorship?");
    expect(found).toHaveLength(3);
  });

  it("stays quiet for a plain hello", () => {
    expect(detectDecisionsNeeded("Hi, great to connect!")).toEqual([]);
  });
});

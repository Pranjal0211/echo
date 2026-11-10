import { FakeDraftModel, ModelUnavailableError, type FactSuggester } from "@echo/ai";
import { ApiError, ProfileResponse, SuggestFactsResponse, type Profile } from "@echo/contracts";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";
import { buildSeed } from "./seed.ts";
import { InMemoryStore } from "./store.ts";
import { MissingProfileError } from "./supabase-store.ts";
import { makeTestApp, TEST_NOW } from "./test-app.ts";

const profileOf = async (res: Response) => ProfileResponse.parse(await res.json()).profile;
const fact = (profile: Profile, id: string) => profile.facts.find((f) => f.id === id);

describe("PATCH /api/profile", () => {
  it("updates the headline and style notes and keeps the rest", async () => {
    const { json } = makeTestApp();
    const res = await json("/api/profile", "PATCH", { headline: "Senior frontend engineer", styleNotes: ["Short", "No filler"] });
    expect(res.status).toBe(200);
    const profile = await profileOf(res);
    expect(profile).toMatchObject({ name: "Jordan Lee", headline: "Senior frontend engineer", styleNotes: ["Short", "No filler"] });
    expect(profile.facts).toHaveLength(5);
  });

  it("rejects an empty change", async () => {
    const { json } = makeTestApp();
    expect((await json("/api/profile", "PATCH", {})).status).toBe(400);
  });

  it("creates the profile on a fresh database, but only with a name", async () => {
    const store = new InMemoryStore(buildSeed(TEST_NOW));
    let saved = false;
    const realGet = store.getProfile.bind(store);
    store.getProfile = async () => {
      if (!saved) throw new MissingProfileError();
      return realGet();
    };
    const realSave = store.saveProfile.bind(store);
    store.saveProfile = async (p) => {
      saved = true;
      await realSave(p);
    };
    const app = createApp({ store, model: new FakeDraftModel(), suggester: new FakeDraftModel(), now: () => TEST_NOW, newId: () => "x" });
    const patch = (body: unknown) =>
      app.request("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

    expect((await app.request("/api/profile")).status).toBe(404);
    const noName = await patch({ headline: "Engineer" });
    expect(noName.status).toBe(400);
    expect(ApiError.parse(await noName.json()).error.message).toMatch(/add your name/);

    const created = await profileOf(await patch({ name: "Sam Rivera", headline: "Engineer" }));
    expect(created).toEqual({ name: "Sam Rivera", headline: "Engineer", styleNotes: [], facts: [], styleExamples: [] });
  });
});

describe("facts", () => {
  it("adds a fact the owner typed as verified, so drafts may use it", async () => {
    const { json } = makeTestApp();
    const res = await json("/api/profile/facts", "POST", { text: "  Shipped a React Native app  ", category: "project" });
    expect(res.status).toBe(201);
    expect(fact(await profileOf(res), "id-1")).toEqual({
      id: "id-1",
      text: "Shipped a React Native app",
      category: "project",
      verified: true,
      sensitivity: "normal",
    });
  });

  it("rejects an empty or unknown-category fact", async () => {
    const { json } = makeTestApp();
    expect((await json("/api/profile/facts", "POST", { text: " ", category: "project" })).status).toBe(400);
    expect((await json("/api/profile/facts", "POST", { text: "Knows Go", category: "hobby" })).status).toBe(400);
  });

  it("approves, edits and marks a fact sensitive", async () => {
    const { json } = makeTestApp();
    const approved = await profileOf(await json("/api/profile/facts/fact-rust", "PATCH", { verified: true }));
    expect(fact(approved, "fact-rust")?.verified).toBe(true);

    const edited = await profileOf(
      await json("/api/profile/facts/fact-rust", "PATCH", { text: "Two years of production Rust", sensitivity: "ask_every_time" }),
    );
    expect(fact(edited, "fact-rust")).toMatchObject({ text: "Two years of production Rust", sensitivity: "ask_every_time", verified: true });
  });

  it("deletes a fact, and answers 404 for one that doesn't exist", async () => {
    const { json } = makeTestApp();
    const profile = await profileOf(await json("/api/profile/facts/fact-rust", "DELETE"));
    expect(fact(profile, "fact-rust")).toBeUndefined();
    expect((await json("/api/profile/facts/fact-rust", "DELETE")).status).toBe(404);
    expect((await json("/api/profile/facts/nope", "PATCH", { verified: true })).status).toBe(404);
  });
});

describe("POST /api/profile/facts/suggest", () => {
  const resume = [
    "Jordan Lee",
    "- Four years building production React and TypeScript apps",
    "- Shipped an offline-first React Native app",
    "- Reach me at jordan@example.com",
    "- Will need visa sponsorship from 2027",
  ].join("\n");

  it("saves new suggestions unverified, skipping duplicates and contact details", async () => {
    const { json } = makeTestApp();
    const res = await json("/api/profile/facts/suggest", "POST", { resumeText: resume });
    expect(res.status).toBe(200);
    const { profile, added, skipped } = SuggestFactsResponse.parse(await res.json());
    expect({ added, skipped }).toEqual({ added: 2, skipped: 2 });
    const suggested = profile.facts.filter((f) => !f.verified && f.id.startsWith("id-"));
    expect(suggested.map((f) => [f.text, f.sensitivity])).toEqual([
      ["Shipped an offline-first React Native app", "normal"],
      ["Will need visa sponsorship from 2027", "ask_every_time"],
    ]);
  });

  it("keeps suggested facts out of drafts until they're approved", async () => {
    const { json } = makeTestApp();
    await json("/api/profile/facts/suggest", "POST", { resumeText: resume });
    const draftRes = await json("/api/drafts/generate", "POST", {
      conversationId: "convo-alex",
      intent: "interested",
      tone: "warm",
      length: "medium",
    });
    const { draft } = (await draftRes.json()) as { draft: { factIdsUsed: string[] } };
    expect(draft.factIdsUsed.every((id) => !id.startsWith("id-"))).toBe(true);
  });

  it("rejects an empty resume and one over the size limit", async () => {
    const { json } = makeTestApp();
    expect((await json("/api/profile/facts/suggest", "POST", { resumeText: "  " })).status).toBe(400);
    expect((await json("/api/profile/facts/suggest", "POST", { resumeText: "a".repeat(30_001) })).status).toBe(400);
  });

  it("passes on the model's error and saves nothing", async () => {
    const failing: FactSuggester = {
      modelId: "failing",
      async suggestFacts() {
        throw new ModelUnavailableError("rate_limited", "Gemini's free-tier limit was reached.");
      },
    };
    const store = new InMemoryStore(buildSeed(TEST_NOW));
    const app = createApp({ store, model: new FakeDraftModel(), suggester: failing, now: () => TEST_NOW, newId: () => "x" });
    const res = await app.request("/api/profile/facts/suggest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resumeText: resume }),
    });
    expect(res.status).toBe(429);
    expect((await store.getProfile()).facts).toHaveLength(5);
  });
});

describe("style examples", () => {
  it("adds and deletes an example", async () => {
    const { json } = makeTestApp();
    const added = await json("/api/profile/examples", "POST", { situation: "Declining politely", text: "Thanks, I'll pass for now. Jordan" });
    expect(added.status).toBe(201);
    expect((await profileOf(added)).styleExamples.at(-1)).toEqual({
      id: "id-1",
      situation: "Declining politely",
      text: "Thanks, I'll pass for now. Jordan",
    });
    const after = await profileOf(await json("/api/profile/examples/id-1", "DELETE"));
    expect(after.styleExamples.some((e) => e.id === "id-1")).toBe(false);
    expect((await json("/api/profile/examples/id-1", "DELETE")).status).toBe(404);
  });
});

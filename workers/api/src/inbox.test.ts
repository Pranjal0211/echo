import { describe, expect, it } from "vitest";
import { InboxItem, InboxResponse, ProfileResponse } from "@echo/contracts";
import { makeTestApp, TEST_NOW } from "./test-app.ts";

describe("GET /api/inbox", () => {
  it("lists waiting-on-me threads first, oldest first", async () => {
    const { app } = makeTestApp();
    const body = InboxResponse.parse(await (await app.request("/api/inbox")).json());
    expect(body.items.map((i) => i.conversation.id)).toEqual([
      "convo-alex",
      "convo-priya",
      "convo-sam",
      "convo-dana",
    ]);
  });
});

describe("GET /api/profile", () => {
  it("returns the synthetic profile", async () => {
    const { app } = makeTestApp();
    const body = ProfileResponse.parse(await (await app.request("/api/profile")).json());
    expect(body.profile.name).toBe("Jordan Lee");
  });
});

describe("POST /api/conversations", () => {
  const paste = {
    channel: "linkedin",
    contact: { name: "Riley Chen", company: "Acme", relationship: "recruiter" },
    message: "Hi Jordan, open to a chat about a UI role?",
  };

  it("creates a conversation waiting on me since now", async () => {
    const { json } = makeTestApp();
    const res = await json("/api/conversations", "POST", paste);
    expect(res.status).toBe(201);
    const item = InboxItem.parse(await res.json());
    expect(item.conversation).toMatchObject({
      waitingOn: "me",
      waitingSince: TEST_NOW.toISOString(),
      importSource: "pasted",
    });
    expect(item.contact.name).toBe("Riley Chen");
  });

  it("shows up in the inbox", async () => {
    const { app, json } = makeTestApp();
    await json("/api/conversations", "POST", paste);
    const body = InboxResponse.parse(await (await app.request("/api/inbox")).json());
    expect(body.items).toHaveLength(5);
  });

  it("rejects an empty message with a readable 400", async () => {
    const { json } = makeTestApp();
    const res = await json("/api/conversations", "POST", { ...paste, message: "  " });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: { code: "bad_request" } });
  });

  it("rejects non-JSON bodies", async () => {
    const { app } = makeTestApp();
    const res = await app.request("/api/conversations", { method: "POST", body: "hello" });
    expect(res.status).toBe(400);
  });
});

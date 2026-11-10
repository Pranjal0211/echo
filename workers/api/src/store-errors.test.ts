import { describe, expect, it } from "vitest";
import { ApiError } from "@echo/contracts";
import { FakeDraftModel } from "@echo/ai";
import { createApp } from "./app.ts";
import { buildSeed } from "./seed.ts";
import { InMemoryStore } from "./store.ts";
import { MissingProfileError, StoreError } from "./supabase-store.ts";

function appWithFailingStore(error: Error) {
  const store = new InMemoryStore(buildSeed(new Date("2026-11-10T12:00:00.000Z")));
  store.listConversations = async () => {
    throw error;
  };
  return createApp({ store, model: new FakeDraftModel(), suggester: new FakeDraftModel(), now: () => new Date(), newId: () => "id" });
}

describe("storage errors", () => {
  it("returns 503 with a hint, not the database's message, when the database fails", async () => {
    const res = await appWithFailingStore(new StoreError("read conversations", "connection refused at 10.0.0.5")).request("/api/inbox");
    expect(res.status).toBe(503);
    const body = ApiError.parse(await res.json());
    expect(body.error.code).toBe("storage_error");
    expect(body.error.message).toMatch(/npm run db:start/);
    expect(body.error.message).not.toMatch(/10\.0\.0\.5/);
  });

  it("answers 404 with how to add a profile when the database is empty", async () => {
    const res = await appWithFailingStore(new MissingProfileError()).request("/api/inbox");
    expect(res.status).toBe(404);
    expect(ApiError.parse(await res.json()).error.message).toMatch(/db:seed/);
  });
});

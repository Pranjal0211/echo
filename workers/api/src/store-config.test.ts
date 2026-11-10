import { describe, expect, it } from "vitest";
import { createStore, StoreConfigError } from "./store-config.ts";
import { InMemoryStore } from "./store.ts";
import { SupabaseStore } from "./supabase-store.ts";

const now = new Date("2026-11-10T12:00:00.000Z");

describe("createStore", () => {
  it("uses synthetic data in memory by default", () => {
    expect(createStore({}, now)).toBeInstanceOf(InMemoryStore);
    expect(createStore({ ECHO_STORE: "memory" }, now)).toBeInstanceOf(InMemoryStore);
  });

  it("uses Supabase when it's chosen and configured", () => {
    const store = createStore({ ECHO_STORE: "supabase", SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_SECRET_KEY: "test-key" }, now);
    expect(store).toBeInstanceOf(SupabaseStore);
  });

  it("fails every call with setup help when Supabase is half configured, instead of using memory", async () => {
    const store = createStore({ ECHO_STORE: "supabase", SUPABASE_URL: "http://127.0.0.1:54321" }, now);
    expect(store).not.toBeInstanceOf(InMemoryStore);
    await expect(store.getProfile()).rejects.toThrow(StoreConfigError);
    await expect(store.listConversations()).rejects.toThrow(/SUPABASE_SECRET_KEY/);
  });
});

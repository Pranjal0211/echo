import { FakeDraftModel } from "@echo/ai";
import { createApp } from "./app.ts";
import { buildSeed } from "./seed.ts";
import { InMemoryStore } from "./store.ts";

export const TEST_NOW = new Date("2026-11-09T12:00:00.000Z");

export function makeTestApp() {
  let n = 0;
  const store = new InMemoryStore(buildSeed(TEST_NOW));
  const app = createApp({
    store,
    model: new FakeDraftModel(),
    suggester: new FakeDraftModel(),
    now: () => TEST_NOW,
    newId: () => `id-${++n}`,
  });
  const json = (path: string, method: string, body?: unknown) =>
    app.request(path, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  return { app, store, json };
}

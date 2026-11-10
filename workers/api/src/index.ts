import { FakeDraftModel } from "@echo/ai";
import { createApp } from "./app.ts";
import { buildSeed } from "./seed.ts";
import { InMemoryStore } from "./store.ts";

// Milestone 0: synthetic data in memory and the fake model. A real model adapter
// arrives with ROAST R3's decision; Supabase arrives in Milestone 1.
export default createApp({
  store: new InMemoryStore(buildSeed(new Date())),
  model: new FakeDraftModel(),
  now: () => new Date(),
  newId: () => crypto.randomUUID(),
});

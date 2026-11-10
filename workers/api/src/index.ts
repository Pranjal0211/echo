import { FakeDraftModel } from "@echo/ai";
import { createApp } from "./app.ts";
import { buildSeed } from "./seed.ts";
import { InMemoryStore } from "./store.ts";

// Milestone 0: synthetic data in memory and the fake model. A real model adapter
// arrives with ROAST R3's decision; Supabase arrives in Milestone 1.

let app: ReturnType<typeof createApp> | null = null;

/**
 * Built on the first request, not at module load: Workers report the clock as the
 * Unix epoch outside a request, which would date every seeded message to 1970.
 */
function getApp() {
  app ??= createApp({
    store: new InMemoryStore(buildSeed(new Date())),
    model: new FakeDraftModel(),
    now: () => new Date(),
    newId: () => crypto.randomUUID(),
  });
  return app;
}

export default {
  fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    return getApp().fetch(request, env, ctx);
  },
} satisfies ExportedHandler;

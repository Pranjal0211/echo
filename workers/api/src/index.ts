import { createApp } from "./app.ts";
import { createModel, type ModelEnv } from "./model-config.ts";
import { buildSeed } from "./seed.ts";
import { InMemoryStore } from "./store.ts";

// Synthetic data in memory; the model comes from ECHO_MODEL (fake by default, Gemini
// when configured). Supabase arrives in Milestone 1.

let app: ReturnType<typeof createApp> | null = null;

/**
 * Built on the first request, not at module load: Workers report the clock as the
 * Unix epoch outside a request, which would date every seeded message to 1970.
 */
function getApp(env: ModelEnv) {
  app ??= createApp({
    store: new InMemoryStore(buildSeed(new Date())),
    model: createModel(env),
    now: () => new Date(),
    newId: () => crypto.randomUUID(),
  });
  return app;
}

export default {
  fetch(request: Request, env: ModelEnv, ctx: ExecutionContext) {
    return getApp(env).fetch(request, env, ctx);
  },
} satisfies ExportedHandler<ModelEnv>;

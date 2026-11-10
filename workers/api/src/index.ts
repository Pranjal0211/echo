import { createApp } from "./app.ts";
import { createModel, type ModelEnv } from "./model-config.ts";
import { createStore, type StoreEnv } from "./store-config.ts";

// Storage comes from ECHO_STORE (memory by default, Supabase when configured) and the
// model from ECHO_MODEL (fake by default, Gemini when configured).

type Env = ModelEnv & StoreEnv;

let app: ReturnType<typeof createApp> | null = null;

/**
 * Built on the first request, not at module load: Workers report the clock as the
 * Unix epoch outside a request, which would date every seeded message to 1970.
 */
function getApp(env: Env) {
  const model = createModel(env);
  app ??= createApp({
    store: createStore(env, new Date()),
    model,
    suggester: model,
    now: () => new Date(),
    newId: () => crypto.randomUUID(),
  });
  return app;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return getApp(env).fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;

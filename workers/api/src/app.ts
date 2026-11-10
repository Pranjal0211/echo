import { Hono } from "hono";
import type { AppDeps } from "./deps.ts";
import { toErrorResponse } from "./http.ts";
import { draftRoutes } from "./routes/drafts.ts";
import { inboxRoutes } from "./routes/inbox.ts";
import { profileRoutes } from "./routes/profile.ts";

export function createApp(deps: AppDeps) {
  const app = new Hono();
  app.onError(toErrorResponse);
  app.notFound((c) => c.json({ error: { code: "not_found", message: "No such route." } }, 404));

  app.get("/api/health", (c) => c.json({ ok: true, milestone: 0 }));
  app.route("/api", inboxRoutes(deps));
  app.route("/api", draftRoutes(deps));
  app.route("/api", profileRoutes(deps));

  return app;
}

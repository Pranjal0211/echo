import { Hono } from "hono";
import { toErrorResponse } from "./http.ts";

export function createApp() {
  const app = new Hono();
  app.onError(toErrorResponse);
  app.notFound((c) => c.json({ error: { code: "not_found", message: "No such route." } }, 404));

  app.get("/api/health", (c) => c.json({ ok: true, milestone: 0 }));

  return app;
}

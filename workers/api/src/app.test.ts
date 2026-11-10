import { describe, expect, it } from "vitest";
import { makeTestApp } from "./test-app.ts";

describe("api skeleton", () => {
  const { app } = makeTestApp();

  it("reports health", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, milestone: 0 });
  });

  it("returns the standard error shape for unknown routes", async () => {
    const res = await app.request("/api/nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: { code: "not_found" } });
  });
});

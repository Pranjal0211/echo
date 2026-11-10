import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApiErrorCode } from "@echo/contracts";
import { ModelOutputError, ModelUnavailableError } from "@echo/ai";
import { DomainError } from "@echo/core";
import { StoreConfigError } from "./store-config.ts";
import { MissingProfileError, StoreError } from "./supabase-store.ts";
import type { z } from "zod";

export class HttpError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export function notFound(what: string): HttpError {
  return new HttpError(404, "not_found", `${what} not found.`);
}

/** Validate a JSON body against a shared contract; 400 with readable issues otherwise. */
export async function parseBody<S extends z.ZodType>(c: Context, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw new HttpError(400, "bad_request", "Body must be JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const detail = result.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
    throw new HttpError(400, "bad_request", detail);
  }
  return result.data;
}

const DOMAIN_STATUS: Record<DomainError["code"], [ContentfulStatusCode, ApiErrorCode]> = {
  version_conflict: [409, "version_conflict"],
  invalid_transition: [409, "version_conflict"],
  policy_blocked: [403, "policy_blocked"],
};

/** Every error leaves as `{ error: { code, message } }`. Message bodies are never logged. */
export function toErrorResponse(err: unknown, c: Context): Response {
  if (err instanceof HttpError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.status);
  }
  if (err instanceof DomainError) {
    const [status, code] = DOMAIN_STATUS[err.code];
    return c.json({ error: { code, message: err.message } }, status);
  }
  if (err instanceof ModelOutputError) {
    return c.json({ error: { code: "model_error", message: "The model returned an unusable draft. Try again." } }, 502);
  }
  if (err instanceof ModelUnavailableError) {
    const status = err.reason === "rate_limited" ? 429 : 503;
    return c.json({ error: { code: "model_error", message: err.message } }, status);
  }
  if (err instanceof MissingProfileError) {
    return c.json({ error: { code: "not_found", message: err.message } }, 404);
  }
  if (err instanceof StoreConfigError) {
    return c.json({ error: { code: "storage_error", message: err.message } }, 503);
  }
  if (err instanceof StoreError) {
    console.error("Store error", err.message);
    return c.json({ error: { code: "storage_error", message: "Couldn't reach the database. Is Supabase running? Try `npm run db:start`." } }, 503);
  }
  console.error("Unhandled error", err instanceof Error ? err.name : typeof err);
  return c.json({ error: { code: "bad_request", message: "Something went wrong." } }, 500);
}

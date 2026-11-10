import { buildSeed } from "./seed.ts";
import { type EchoStore, InMemoryStore } from "./store.ts";
import { SupabaseStore } from "./supabase-store.ts";

/** Worker bindings that choose where data lives. Secrets live in `.dev.vars` locally. */
export interface StoreEnv {
  ECHO_STORE?: string;
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
}

export class StoreConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreConfigError";
  }
}

/** Fails every call with setup guidance, so a missing setting shows up in the UI, not a crash. */
class UnconfiguredStore implements EchoStore {
  readonly #error: StoreConfigError;
  constructor(message: string) {
    this.#error = new StoreConfigError(message);
  }
  #fail(): never {
    throw this.#error;
  }
  getProfile = async () => this.#fail();
  saveProfile = async () => this.#fail();
  listConversations = async () => this.#fail();
  getConversation = async () => this.#fail();
  saveConversation = async () => this.#fail();
  getContact = async () => this.#fail();
  saveContact = async () => this.#fail();
  getDraft = async () => this.#fail();
  saveDraft = async () => this.#fail();
  latestDraftFor = async () => this.#fail();
}

/**
 * `ECHO_STORE=supabase` keeps data in Postgres (ADR-020); anything else uses synthetic
 * data in memory, which resets on restart. A half-configured Supabase setup fails every
 * request instead of falling back to memory, so the owner never thinks data was saved
 * when it wasn't.
 */
export function createStore(env: StoreEnv, now: Date): EchoStore {
  if (env.ECHO_STORE !== "supabase") return new InMemoryStore(buildSeed(now));
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) {
    return new UnconfiguredStore(
      "ECHO_STORE is supabase but SUPABASE_URL or SUPABASE_SECRET_KEY is not set. Add them to workers/api/.dev.vars (see .dev.vars.example) and restart the API.",
    );
  }
  return new SupabaseStore(url, key);
}

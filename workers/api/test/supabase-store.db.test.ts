import { createClient } from "@supabase/supabase-js";
import { afterAll, describe, it } from "vitest";
import { SupabaseStore } from "../src/supabase-store.ts";
import { assertLocal, localSupabase } from "../scripts/local-supabase.ts";
import { describeStoreContract } from "./store-contract.ts";

/**
 * Runs the store contract against the local Supabase. Skipped unless ECHO_DB_TESTS=1
 * (`npm run test:db`), so `npm test` and CI without Docker stay fast.
 * Uses its own profile and id prefix, and deletes everything it wrote afterwards.
 */
const enabled = process.env.ECHO_DB_TESTS === "1";
const prefix = `dbtest-${crypto.randomUUID().slice(0, 8)}`;

if (enabled) {
  const { url, secretKey } = localSupabase();
  assertLocal(url);

  describeStoreContract("SupabaseStore", async () => ({
    store: new SupabaseStore(url, secretKey, { profileId: `${prefix}-profile` }),
    prefix,
  }));

  afterAll(async () => {
    const db = createClient(url, secretKey, { auth: { persistSession: false } });
    // Drafts and messages cascade from conversations; facts and examples from the profile.
    await db.from("conversations").delete().like("id", `${prefix}-%`);
    await db.from("contacts").delete().like("id", `${prefix}-%`);
    await db.from("profiles").delete().eq("id", `${prefix}-profile`);
  });
} else {
  describe.skip("SupabaseStore store contract (run with npm run test:db)", () => {
    it("needs the local Supabase from npm run db:start", () => {});
  });
}

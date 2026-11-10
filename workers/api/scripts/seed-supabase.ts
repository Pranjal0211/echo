/**
 * `npm run db:seed`: load the synthetic demo data from src/seed.ts into the local Supabase.
 * Made-up people only. Refuses any database that isn't on this machine.
 */
import { buildSeed } from "../src/seed.ts";
import { SupabaseStore } from "../src/supabase-store.ts";
import { assertLocal, localSupabase } from "./local-supabase.ts";

const { url, secretKey } = localSupabase();
assertLocal(url);

const store = new SupabaseStore(url, secretKey);
const seed = buildSeed(new Date());
await store.saveProfile(seed.profile);
for (const contact of seed.contacts) await store.saveContact(contact);
for (const conversation of seed.conversations) await store.saveConversation(conversation);

console.log(
  `Seeded demo data: 1 profile, ${seed.profile.facts.length} facts, ${seed.contacts.length} contacts, ${seed.conversations.length} conversations.`,
);

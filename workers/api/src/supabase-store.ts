import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Contact, Conversation, Draft, Profile } from "@echo/contracts";
import type { EchoStore } from "./store.ts";
import {
  type ContactRow,
  type ConversationRow,
  type DraftRow,
  type ExampleRow,
  type FactRow,
  type MessageRow,
  type ProfileRow,
  contactFromRow,
  contactToRow,
  conversationFromRows,
  conversationToArgs,
  draftFromRow,
  draftToRow,
  OWNER_PROFILE_ID,
  profileFromRows,
  profileToArgs,
} from "./supabase-rows.ts";

/** A database call failed. The message names the operation, never the data. */
export class StoreError extends Error {
  constructor(operation: string, detail: string) {
    super(`Database ${operation} failed: ${detail}`);
    this.name = "StoreError";
  }
}

/** No profile has been saved yet (fresh database). */
export class MissingProfileError extends Error {
  constructor() {
    super("No profile yet. Run `npm run db:seed` for demo data, or add yours in the Knowledge Base.");
    this.name = "MissingProfileError";
  }
}

interface Result<T> {
  data: T | null;
  error: { message: string } | null;
}

function unwrap<T>(operation: string, result: Result<T>): T {
  if (result.error) throw new StoreError(operation, result.error.message);
  return result.data as T;
}

const CONVERSATION_COLUMNS = "id, channel, contact_id, subject, import_source, waiting_on, waiting_since";
const MESSAGE_COLUMNS = "id, conversation_id, direction, content, occurred_at";
const CONTACT_COLUMNS = "id, name, company, role, relationship, verified_email, linkedin_url, opt_out";
const DRAFT_COLUMNS =
  "id, conversation_id, channel, delivery_capability, intent, tone, length, subject, body, version, status, fact_ids_used, warnings, decisions_needed, model_id, created_at, updated_at";

/**
 * Postgres storage through Supabase (ADR-020). Uses the secret (service_role) key, so it
 * must only ever run in the Worker. Multi-row writes go through database functions so
 * each save is one transaction.
 */
export class SupabaseStore implements EchoStore {
  readonly #db: SupabaseClient;
  readonly #profileId: string;

  /** `profileId` is for tests, which keep their own profile so they never touch the owner's. */
  constructor(url: string, secretKey: string, options: { profileId?: string } = {}) {
    this.#db = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    this.#profileId = options.profileId ?? OWNER_PROFILE_ID;
  }

  async getProfile(): Promise<Profile> {
    const [profile, facts, examples] = await Promise.all([
      this.#db.from("profiles").select("id, name, headline, style_notes").eq("id", this.#profileId).maybeSingle(),
      this.#db.from("profile_facts").select("id, position, text, category, verified, sensitivity").eq("profile_id", this.#profileId),
      this.#db.from("style_examples").select("id, position, situation, text").eq("profile_id", this.#profileId),
    ]);
    const row = unwrap<ProfileRow | null>("read profile", profile);
    if (!row) throw new MissingProfileError();
    return profileFromRows(row, unwrap<FactRow[]>("read facts", facts), unwrap<ExampleRow[]>("read style examples", examples));
  }

  async saveProfile(profile: Profile): Promise<void> {
    unwrap("save profile", await this.#db.rpc("save_profile", profileToArgs(profile, this.#profileId)));
  }

  async listConversations(): Promise<Conversation[]> {
    const [conversations, messages] = await Promise.all([
      this.#db.from("conversations").select(CONVERSATION_COLUMNS),
      this.#db.from("messages").select(MESSAGE_COLUMNS),
    ]);
    const byConversation = new Map<string, MessageRow[]>();
    for (const m of unwrap<(MessageRow & { conversation_id: string })[]>("read messages", messages)) {
      const list = byConversation.get(m.conversation_id) ?? [];
      list.push(m);
      byConversation.set(m.conversation_id, list);
    }
    return unwrap<ConversationRow[]>("read conversations", conversations).map((row) =>
      conversationFromRows(row, byConversation.get(row.id) ?? []),
    );
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const [conversation, messages] = await Promise.all([
      this.#db.from("conversations").select(CONVERSATION_COLUMNS).eq("id", id).maybeSingle(),
      this.#db.from("messages").select(MESSAGE_COLUMNS).eq("conversation_id", id),
    ]);
    const row = unwrap<ConversationRow | null>("read conversation", conversation);
    return row ? conversationFromRows(row, unwrap<MessageRow[]>("read messages", messages)) : null;
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    unwrap("save conversation", await this.#db.rpc("save_conversation", conversationToArgs(conversation)));
  }

  async getContact(id: string): Promise<Contact | null> {
    const row = unwrap<ContactRow | null>(
      "read contact",
      await this.#db.from("contacts").select(CONTACT_COLUMNS).eq("id", id).maybeSingle(),
    );
    return row ? contactFromRow(row) : null;
  }

  async saveContact(contact: Contact): Promise<void> {
    unwrap("save contact", await this.#db.from("contacts").upsert(contactToRow(contact)));
  }

  async getDraft(id: string): Promise<Draft | null> {
    const row = unwrap<DraftRow | null>(
      "read draft",
      await this.#db.from("drafts").select(DRAFT_COLUMNS).eq("id", id).maybeSingle(),
    );
    return row ? draftFromRow(row) : null;
  }

  async saveDraft(draft: Draft): Promise<void> {
    unwrap("save draft", await this.#db.from("drafts").upsert(draftToRow(draft)));
  }

  async latestDraftFor(conversationId: string): Promise<Draft | null> {
    const row = unwrap<DraftRow | null>(
      "read latest draft",
      await this.#db
        .from("drafts")
        .select(DRAFT_COLUMNS)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    );
    return row ? draftFromRow(row) : null;
  }
}

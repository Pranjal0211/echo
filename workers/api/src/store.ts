import type { Contact, Conversation, Draft, Profile } from "@echo/contracts";
import type { SeedData } from "./seed.ts";

/**
 * Storage port. `InMemoryStore` serves tests and quick demos; `SupabaseStore` keeps data
 * in Postgres (ADR-020). Routes only see this interface.
 */
export interface EchoStore {
  getProfile(): Promise<Profile>;
  /** Replace the profile with its facts and style examples. */
  saveProfile(profile: Profile): Promise<void>;
  listConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<void>;
  getContact(id: string): Promise<Contact | null>;
  saveContact(contact: Contact): Promise<void>;
  getDraft(id: string): Promise<Draft | null>;
  saveDraft(draft: Draft): Promise<void>;
  latestDraftFor(conversationId: string): Promise<Draft | null>;
}

/** Per-isolate memory. Resets when the dev server restarts; fine for synthetic data. */
export class InMemoryStore implements EchoStore {
  private profile: Profile;
  private readonly contacts = new Map<string, Contact>();
  private readonly conversations = new Map<string, Conversation>();
  private readonly drafts = new Map<string, Draft>();

  constructor(seed: SeedData) {
    this.profile = structuredClone(seed.profile);
    for (const c of seed.contacts) this.contacts.set(c.id, structuredClone(c));
    for (const c of seed.conversations) this.conversations.set(c.id, structuredClone(c));
  }

  async getProfile() {
    return structuredClone(this.profile);
  }
  async saveProfile(profile: Profile) {
    this.profile = structuredClone(profile);
  }
  async listConversations() {
    return [...this.conversations.values()].map((c) => structuredClone(c));
  }
  async getConversation(id: string) {
    const found = this.conversations.get(id);
    return found ? structuredClone(found) : null;
  }
  async saveConversation(conversation: Conversation) {
    this.conversations.set(conversation.id, structuredClone(conversation));
  }
  async getContact(id: string) {
    const found = this.contacts.get(id);
    return found ? structuredClone(found) : null;
  }
  async saveContact(contact: Contact) {
    this.contacts.set(contact.id, structuredClone(contact));
  }
  async getDraft(id: string) {
    const found = this.drafts.get(id);
    return found ? structuredClone(found) : null;
  }
  async saveDraft(draft: Draft) {
    this.drafts.set(draft.id, structuredClone(draft));
  }
  async latestDraftFor(conversationId: string) {
    const all = [...this.drafts.values()].filter((d) => d.conversationId === conversationId);
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return all[0] ? structuredClone(all[0]) : null;
  }
}

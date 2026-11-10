import {
  Contact,
  Conversation,
  Draft,
  Profile,
  type Message,
  type ProfileFact,
  type StyleExample,
} from "@echo/contracts";

/**
 * Row shapes of supabase/migrations/*_initial_schema.sql and the mapping to and from the
 * shared contracts. Rows read back are validated with the contract schemas, so a schema
 * drift fails loudly instead of leaking bad data to the UI.
 */

/** Before sign-in there is one profile, stored under this id (ADR-020). */
export const OWNER_PROFILE_ID = "owner";

export interface ProfileRow {
  id: string;
  name: string;
  headline: string;
  style_notes: string[];
}

export interface FactRow {
  id: string;
  position: number;
  text: string;
  category: ProfileFact["category"];
  verified: boolean;
  sensitivity: ProfileFact["sensitivity"];
}

export interface ExampleRow {
  id: string;
  position: number;
  situation: string;
  text: string;
}

export interface ContactRow {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  relationship: Contact["relationship"];
  verified_email: string | null;
  linkedin_url: string | null;
  opt_out: boolean;
}

export interface MessageRow {
  id: string;
  direction: Message["direction"];
  content: string;
  occurred_at: string;
}

export interface ConversationRow {
  id: string;
  channel: Conversation["channel"];
  contact_id: string;
  subject: string | null;
  import_source: Conversation["importSource"];
  waiting_on: Conversation["waitingOn"];
  waiting_since: string | null;
}

export interface DraftRow {
  id: string;
  conversation_id: string;
  channel: Draft["channel"];
  delivery_capability: Draft["deliveryCapability"];
  intent: Draft["intent"];
  tone: Draft["tone"];
  length: Draft["length"];
  subject: string | null;
  body: string;
  version: number;
  status: Draft["status"];
  fact_ids_used: string[];
  warnings: string[];
  decisions_needed: string[];
  model_id: string;
  created_at: string;
  updated_at: string;
}

/** Postgres returns `2026-11-10 09:00:00+00` style offsets; contracts want ISO `...Z`. */
export function isoTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid timestamp from the database: ${value}`);
  return date.toISOString();
}

const byPosition = (a: { position: number }, b: { position: number }) => a.position - b.position;

export function profileFromRows(profile: ProfileRow, facts: FactRow[], examples: ExampleRow[]): Profile {
  return Profile.parse({
    name: profile.name,
    headline: profile.headline,
    styleNotes: profile.style_notes,
    facts: [...facts].sort(byPosition).map((f) => ({
      id: f.id,
      text: f.text,
      category: f.category,
      verified: f.verified,
      sensitivity: f.sensitivity,
    })),
    styleExamples: [...examples].sort(byPosition).map((e) => ({ id: e.id, situation: e.situation, text: e.text })),
  });
}

/** Arguments for the `save_profile` database function. */
export function profileToArgs(profile: Profile, profileId: string = OWNER_PROFILE_ID) {
  return {
    p_profile: { id: profileId, name: profile.name, headline: profile.headline, style_notes: profile.styleNotes },
    p_facts: profile.facts.map((f: ProfileFact) => ({
      id: f.id,
      text: f.text,
      category: f.category,
      verified: f.verified,
      sensitivity: f.sensitivity,
    })),
    p_examples: profile.styleExamples.map((e: StyleExample) => ({ id: e.id, situation: e.situation, text: e.text })),
  };
}

export function contactFromRow(row: ContactRow): Contact {
  return Contact.parse({
    id: row.id,
    name: row.name,
    company: row.company,
    role: row.role,
    relationship: row.relationship,
    verifiedEmail: row.verified_email,
    linkedinUrl: row.linkedin_url,
    optOut: row.opt_out,
  });
}

export function contactToRow(contact: Contact): ContactRow {
  return {
    id: contact.id,
    name: contact.name,
    company: contact.company,
    role: contact.role,
    relationship: contact.relationship,
    verified_email: contact.verifiedEmail,
    linkedin_url: contact.linkedinUrl,
    opt_out: contact.optOut,
  };
}

export function conversationFromRows(row: ConversationRow, messages: MessageRow[]): Conversation {
  return Conversation.parse({
    id: row.id,
    channel: row.channel,
    contactId: row.contact_id,
    subject: row.subject,
    importSource: row.import_source,
    waitingOn: row.waiting_on,
    waitingSince: row.waiting_since === null ? null : isoTime(row.waiting_since),
    messages: [...messages]
      .sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at))
      .map((m) => ({ id: m.id, direction: m.direction, content: m.content, occurredAt: isoTime(m.occurred_at) })),
  });
}

/** Arguments for the `save_conversation` database function. */
export function conversationToArgs(conversation: Conversation) {
  const row: ConversationRow = {
    id: conversation.id,
    channel: conversation.channel,
    contact_id: conversation.contactId,
    subject: conversation.subject,
    import_source: conversation.importSource,
    waiting_on: conversation.waitingOn,
    waiting_since: conversation.waitingSince,
  };
  const messages: MessageRow[] = conversation.messages.map((m) => ({
    id: m.id,
    direction: m.direction,
    content: m.content,
    occurred_at: m.occurredAt,
  }));
  return { p_conversation: row, p_messages: messages };
}

export function draftFromRow(row: DraftRow): Draft {
  return Draft.parse({
    id: row.id,
    conversationId: row.conversation_id,
    channel: row.channel,
    deliveryCapability: row.delivery_capability,
    intent: row.intent,
    tone: row.tone,
    length: row.length,
    subject: row.subject,
    body: row.body,
    version: row.version,
    status: row.status,
    factIdsUsed: row.fact_ids_used,
    warnings: row.warnings,
    decisionsNeeded: row.decisions_needed,
    modelId: row.model_id,
    createdAt: isoTime(row.created_at),
    updatedAt: isoTime(row.updated_at),
  });
}

export function draftToRow(draft: Draft): DraftRow {
  return {
    id: draft.id,
    conversation_id: draft.conversationId,
    channel: draft.channel,
    delivery_capability: draft.deliveryCapability,
    intent: draft.intent,
    tone: draft.tone,
    length: draft.length,
    subject: draft.subject,
    body: draft.body,
    version: draft.version,
    status: draft.status,
    fact_ids_used: draft.factIdsUsed,
    warnings: draft.warnings,
    decisions_needed: draft.decisionsNeeded,
    model_id: draft.modelId,
    created_at: draft.createdAt,
    updated_at: draft.updatedAt,
  };
}

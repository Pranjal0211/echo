import { z } from "zod";
import {
  Channel,
  Contact,
  Conversation,
  Draft,
  Length,
  Profile,
  Relationship,
  ReplyIntent,
  Tone,
} from "./domain.ts";

export const MAX_MESSAGE_CHARS = 20_000;

/** POST /api/conversations — paste a message someone sent me. */
export const CreateConversationRequest = z.object({
  channel: Channel,
  contact: z.object({
    name: z.string().trim().min(1).max(200),
    company: z.string().trim().max(200).optional(),
    role: z.string().trim().max(200).optional(),
    relationship: Relationship,
  }),
  subject: z.string().trim().max(300).optional(),
  message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
});
export type CreateConversationRequest = z.infer<typeof CreateConversationRequest>;

/** One conversation with its contact and latest draft, as the inbox shows it. */
export const InboxItem = z.object({
  conversation: Conversation,
  contact: Contact,
  latestDraft: Draft.nullable(),
});
export type InboxItem = z.infer<typeof InboxItem>;

export const InboxResponse = z.object({ items: z.array(InboxItem) });
export type InboxResponse = z.infer<typeof InboxResponse>;

/** POST /api/drafts/generate */
export const GenerateDraftRequest = z.object({
  conversationId: z.string().min(1),
  intent: ReplyIntent,
  tone: Tone,
  length: Length,
  instructions: z.string().trim().max(500).optional(),
});
export type GenerateDraftRequest = z.infer<typeof GenerateDraftRequest>;

/** PATCH /api/drafts/:id — editing creates a new version. */
export const UpdateDraftRequest = z.object({
  body: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
  subject: z.string().trim().max(300).nullable().optional(),
  expectedVersion: z.number().int().positive(),
});
export type UpdateDraftRequest = z.infer<typeof UpdateDraftRequest>;

/** POST /api/drafts/:id/copy and /mark-sent — act on one exact version. */
export const DraftVersionRequest = z.object({
  version: z.number().int().positive(),
});
export type DraftVersionRequest = z.infer<typeof DraftVersionRequest>;

export const DraftResponse = z.object({ draft: Draft });
export type DraftResponse = z.infer<typeof DraftResponse>;

export const ProfileResponse = z.object({ profile: Profile });
export type ProfileResponse = z.infer<typeof ProfileResponse>;

export const ApiErrorCode = z.enum([
  "bad_request",
  "not_found",
  "version_conflict",
  "policy_blocked",
  "model_error",
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCode>;

export const ApiError = z.object({
  error: z.object({ code: ApiErrorCode, message: z.string() }),
});
export type ApiError = z.infer<typeof ApiError>;

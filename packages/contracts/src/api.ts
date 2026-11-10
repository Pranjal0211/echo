import { z } from "zod";
import {
  Channel,
  Contact,
  Conversation,
  Draft,
  FactCategory,
  Length,
  Profile,
  Relationship,
  ReplyIntent,
  Sensitivity,
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

export const MAX_FACT_CHARS = 500;
export const MAX_RESUME_CHARS = 30_000;

/** PATCH /api/profile — creates the profile on a fresh database when `name` is given. */
export const UpdateProfileRequest = z
  .object({
    name: z.string().trim().min(1).max(200),
    headline: z.string().trim().max(200),
    styleNotes: z.array(z.string().trim().min(1).max(200)).max(20),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: "Change at least one field." });
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequest>;

/** POST /api/profile/facts — a fact the owner typed, so it starts verified. */
export const CreateFactRequest = z.object({
  text: z.string().trim().min(1).max(MAX_FACT_CHARS),
  category: FactCategory,
  sensitivity: Sensitivity.default("normal"),
});
export type CreateFactRequest = z.input<typeof CreateFactRequest>;

/** PATCH /api/profile/facts/:id — edit, approve (`verified: true`) or mark sensitive. */
export const UpdateFactRequest = z
  .object({
    text: z.string().trim().min(1).max(MAX_FACT_CHARS),
    category: FactCategory,
    sensitivity: Sensitivity,
    verified: z.boolean(),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: "Change at least one field." });
export type UpdateFactRequest = z.infer<typeof UpdateFactRequest>;

/** POST /api/profile/examples — a message the owner wrote, used as a style example. */
export const CreateStyleExampleRequest = z.object({
  situation: z.string().trim().min(1).max(200),
  text: z.string().trim().min(1).max(2_000),
});
export type CreateStyleExampleRequest = z.infer<typeof CreateStyleExampleRequest>;

/** POST /api/profile/facts/suggest — the resume text is used once and never stored. */
export const SuggestFactsRequest = z.object({
  resumeText: z.string().trim().min(1).max(MAX_RESUME_CHARS),
});
export type SuggestFactsRequest = z.infer<typeof SuggestFactsRequest>;

export const SuggestFactsResponse = z.object({
  profile: Profile,
  /** New unverified facts waiting for the owner's review. */
  added: z.number().int().nonnegative(),
  /** Suggestions dropped as duplicates or because they held contact details. */
  skipped: z.number().int().nonnegative(),
});
export type SuggestFactsResponse = z.infer<typeof SuggestFactsResponse>;

export const ApiErrorCode = z.enum([
  "bad_request",
  "not_found",
  "version_conflict",
  "policy_blocked",
  "model_error",
  "storage_error",
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCode>;

export const ApiError = z.object({
  error: z.object({ code: ApiErrorCode, message: z.string() }),
});
export type ApiError = z.infer<typeof ApiError>;

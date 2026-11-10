import { z } from "zod";

/** Where a message lives. LinkedIn is copy-and-paste only (ADR-008). */
export const Channel = z.enum(["gmail", "linkedin"]);
export type Channel = z.infer<typeof Channel>;

/** Whether Echo can deliver a draft itself or the owner must copy it. */
export const DeliveryCapability = z.enum(["copy_only", "provider_send"]);
export type DeliveryCapability = z.infer<typeof DeliveryCapability>;

export const Relationship = z.enum([
  "recruiter",
  "hiring_manager",
  "referrer",
  "former_colleague",
  "friend",
  "other",
]);
export type Relationship = z.infer<typeof Relationship>;

export const FactCategory = z.enum([
  "experience",
  "skill",
  "project",
  "education",
  "preference",
  "other",
]);
export type FactCategory = z.infer<typeof FactCategory>;

/** `ask_every_time` facts (salary, visa, notice period…) are never used unless opted in per draft. */
export const Sensitivity = z.enum(["normal", "ask_every_time"]);
export type Sensitivity = z.infer<typeof Sensitivity>;

export const ProfileFact = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  category: FactCategory,
  verified: z.boolean(),
  sensitivity: Sensitivity,
});
export type ProfileFact = z.infer<typeof ProfileFact>;

export const StyleExample = z.object({
  id: z.string().min(1),
  situation: z.string().min(1),
  text: z.string().min(1),
});
export type StyleExample = z.infer<typeof StyleExample>;

export const Profile = z.object({
  name: z.string().min(1),
  headline: z.string(),
  styleNotes: z.array(z.string()),
  facts: z.array(ProfileFact),
  styleExamples: z.array(StyleExample),
});
export type Profile = z.infer<typeof Profile>;

export const Contact = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  company: z.string().nullable(),
  role: z.string().nullable(),
  relationship: Relationship,
  verifiedEmail: z.email().nullable(),
  linkedinUrl: z.url().nullable(),
  optOut: z.boolean(),
});
export type Contact = z.infer<typeof Contact>;

export const Message = z.object({
  id: z.string().min(1),
  direction: z.enum(["inbound", "outbound"]),
  content: z.string().min(1),
  occurredAt: z.iso.datetime(),
});
export type Message = z.infer<typeof Message>;

/** Who owes the next reply. Drives the "waiting on me" list (ROAST R2). */
export const WaitingOn = z.enum(["me", "them", "nobody"]);
export type WaitingOn = z.infer<typeof WaitingOn>;

export const Conversation = z.object({
  id: z.string().min(1),
  channel: Channel,
  contactId: z.string().min(1),
  subject: z.string().nullable(),
  importSource: z.enum(["pasted", "gmail_sync"]),
  waitingOn: WaitingOn,
  waitingSince: z.iso.datetime().nullable(),
  messages: z.array(Message).min(1),
});
export type Conversation = z.infer<typeof Conversation>;

export const ReplyIntent = z.enum([
  "interested",
  "need_details",
  "not_now",
  "not_interested",
  "thanks",
  "follow_up",
  "custom",
]);
export type ReplyIntent = z.infer<typeof ReplyIntent>;

export const Tone = z.enum(["friendly_professional", "warm", "formal", "casual"]);
export type Tone = z.infer<typeof Tone>;

export const Length = z.enum(["short", "medium", "long"]);
export type Length = z.infer<typeof Length>;

/** Draft lifecycle; see docs/ARCHITECTURE.md "Draft state machine". */
export const DraftStatus = z.enum([
  "generated",
  "edited",
  "needs_approval",
  "approved",
  "queued",
  "sending",
  "sent",
  "failed",
  "rejected",
  "cancelled",
  "copied",
  "sent_manually",
]);
export type DraftStatus = z.infer<typeof DraftStatus>;

export const Draft = z
  .object({
    id: z.string().min(1),
    conversationId: z.string().min(1),
    channel: Channel,
    deliveryCapability: DeliveryCapability,
    intent: ReplyIntent,
    tone: Tone,
    length: Length,
    subject: z.string().nullable(),
    body: z.string().min(1),
    version: z.number().int().positive(),
    status: DraftStatus,
    factIdsUsed: z.array(z.string()),
    warnings: z.array(z.string()),
    decisionsNeeded: z.array(z.string()),
    modelId: z.string().min(1),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .refine(
    (draft) =>
      (draft.channel === "gmail" && draft.deliveryCapability === "provider_send") ||
      (draft.channel === "linkedin" && draft.deliveryCapability === "copy_only"),
    {
      message: "Draft delivery capability must match its channel.",
      path: ["deliveryCapability"],
    },
  );
export type Draft = z.infer<typeof Draft>;

/** What a model must return. Validated before anything is stored. */
export const ModelDraftOutput = z.object({
  subject: z.string().nullable(),
  body: z.string().min(1),
  factIdsUsed: z.array(z.string()),
  warnings: z.array(z.string()),
  decisionsNeeded: z.array(z.string()),
});
export type ModelDraftOutput = z.infer<typeof ModelDraftOutput>;

/** One fact a model found in a pasted resume. Saved unverified until the owner approves it. */
export const SuggestedFact = z.object({
  text: z.string().min(1),
  category: FactCategory,
  sensitivity: Sensitivity,
});
export type SuggestedFact = z.infer<typeof SuggestedFact>;

/** What a model must return when suggesting facts from a resume. */
export const FactSuggestionOutput = z.object({ facts: z.array(SuggestedFact) });
export type FactSuggestionOutput = z.infer<typeof FactSuggestionOutput>;

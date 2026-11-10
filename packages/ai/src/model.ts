import type {
  Channel,
  Contact,
  Conversation,
  Length,
  ModelDraftOutput,
  Profile,
  ProfileFact,
  ReplyIntent,
  Tone,
} from "@echo/contracts";

/** Everything a model may see for one draft. `facts` are already filtered by policy. */
export interface DraftContext {
  channel: Channel;
  intent: ReplyIntent;
  tone: Tone;
  length: Length;
  /** Free text from the owner (trusted), e.g. "mention I'm open to remote". */
  instructions?: string;
  contact: Contact;
  conversation: Conversation;
  profile: Pick<Profile, "name" | "headline" | "styleNotes" | "styleExamples">;
  facts: ProfileFact[];
}

/** Model output, plus which model wrote it when an adapter can fall back to another one. */
export type ModelDraftResult = ModelDraftOutput & { modelId?: string };

/** Provider adapter (ADR-007). Swap implementations without touching business logic. */
export interface DraftModel {
  /** The preferred model; a result's `modelId` wins when the adapter fell back. */
  readonly modelId: string;
  generateDraft(context: DraftContext): Promise<ModelDraftResult>;
}

export class ModelOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelOutputError";
  }
}

/** Why a provider couldn't be reached or refused the call. */
export type ModelUnavailableReason = "not_configured" | "auth" | "rate_limited" | "unavailable";

/** The provider failed before returning a draft. Messages are safe to show the owner. */
export class ModelUnavailableError extends Error {
  constructor(
    readonly reason: ModelUnavailableReason,
    message: string,
  ) {
    super(message);
    this.name = "ModelUnavailableError";
  }
}

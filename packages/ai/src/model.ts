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

/** Provider adapter (ADR-007). Swap implementations without touching business logic. */
export interface DraftModel {
  readonly modelId: string;
  generateDraft(context: DraftContext): Promise<ModelDraftOutput>;
}

export class ModelOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelOutputError";
  }
}

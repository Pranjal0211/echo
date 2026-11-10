import type { DraftModel, FactSuggester } from "@echo/ai";
import type { EchoStore } from "./store.ts";

/** Everything routes need, injected so tests can fix the clock and ids. */
export interface AppDeps {
  store: EchoStore;
  model: DraftModel;
  /** Suggests Knowledge Base facts from a pasted resume. */
  suggester: FactSuggester;
  now: () => Date;
  newId: () => string;
}

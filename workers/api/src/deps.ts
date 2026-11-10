import type { DraftModel } from "@echo/ai";
import type { EchoStore } from "./store.ts";

/** Everything routes need, injected so tests can fix the clock and ids. */
export interface AppDeps {
  store: EchoStore;
  model: DraftModel;
  now: () => Date;
  newId: () => string;
}

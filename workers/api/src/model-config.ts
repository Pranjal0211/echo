import { type DraftModel, type FactSuggester, FakeDraftModel, GEMINI_DEFAULT_FALLBACK, GeminiDraftModel, ModelUnavailableError } from "@echo/ai";

/** Worker bindings that choose the drafting model. Secrets live in `.dev.vars` locally. */
export interface ModelEnv {
  ECHO_MODEL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_FALLBACK_MODEL?: string;
}

/** Fails every draft with setup guidance, so a missing key shows up in the UI, not a crash. */
class MissingKeyModel implements DraftModel, FactSuggester {
  readonly modelId = "gemini-not-configured";
  async generateDraft(): Promise<never> {
    throw MissingKeyModel.#error();
  }
  async suggestFacts(): Promise<never> {
    throw MissingKeyModel.#error();
  }
  static #error() {
    return new ModelUnavailableError(
      "not_configured",
      "ECHO_MODEL is gemini but GEMINI_API_KEY is not set. Add it to workers/api/.dev.vars and restart the API.",
    );
  }
}

/** `ECHO_MODEL=gemini` uses Gemini (ADR-019); anything else uses the deterministic fake model. */
export function createModel(env: ModelEnv): DraftModel & FactSuggester {
  if (env.ECHO_MODEL !== "gemini") return new FakeDraftModel();
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) return new MissingKeyModel();
  const fallback = env.GEMINI_FALLBACK_MODEL?.trim();
  return new GeminiDraftModel({
    apiKey,
    model: env.GEMINI_MODEL?.trim() || undefined,
    fallbackModels: fallback ? [fallback] : [GEMINI_DEFAULT_FALLBACK],
  });
}

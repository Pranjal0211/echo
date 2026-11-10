import type { SuggestedFact } from "@echo/contracts";
import { buildFactPrompt, parseFactOutput } from "./fact-suggestions.ts";
import {
  type DraftContext,
  type DraftModel,
  type FactSuggester,
  type ModelDraftResult,
  ModelOutputError,
  ModelUnavailableError,
} from "./model.ts";
import { buildDraftPrompt, type DraftPrompt, parseModelOutput } from "./prompt.ts";

export const GEMINI_DEFAULT_MODEL = "gemini-3.8-flash";
/** Used when the default is overloaded or rate limited on the free tier. */
export const GEMINI_DEFAULT_FALLBACK = "gemini-3.5-flash-lite";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const TIMEOUT_MS = 30_000;

/** JSON Schema for ModelDraftOutput, in the subset Gemini's structured output supports. */
const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: ["string", "null"], description: "Email subject, or null for LinkedIn." },
    body: { type: "string", description: "The reply text, signed by the owner." },
    factIdsUsed: { type: "array", items: { type: "string" }, description: "Ids of <fact> entries used." },
    warnings: { type: "array", items: { type: "string" } },
    decisionsNeeded: { type: "array", items: { type: "string" }, description: "Questions only the owner can answer." },
  },
  required: ["subject", "body", "factIdsUsed", "warnings", "decisionsNeeded"],
  additionalProperties: false,
} as const;

/** JSON Schema for FactSuggestionOutput. */
const FACTS_SCHEMA = {
  type: "object",
  properties: {
    facts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          category: { type: "string", enum: ["experience", "skill", "project", "education", "preference", "other"] },
          sensitivity: { type: "string", enum: ["normal", "ask_every_time"] },
        },
        required: ["text", "category", "sensitivity"],
        additionalProperties: false,
      },
    },
  },
  required: ["facts"],
  additionalProperties: false,
} as const;

export interface GeminiOptions {
  apiKey: string;
  model?: string;
  /** Tried in order when a model is overloaded (5xx) or rate limited (429). */
  fallbackModels?: string[];
  /** Injected in tests; defaults to the global fetch. */
  fetch?: typeof fetch;
}

interface InteractionResponse {
  status?: string;
  steps?: { type?: string; content?: { type?: string; text?: string }[] }[];
  errors?: { code?: string; message?: string }[];
}

/**
 * Drafts with Google Gemini through the Interactions API (ADR-019).
 * `store: false` keeps Google from saving the interaction for later retrieval.
 * Free-tier prompts may still be used by Google to improve its products.
 */
export class GeminiDraftModel implements DraftModel, FactSuggester {
  readonly modelId: string;
  readonly #fallbacks: string[];
  readonly #apiKey: string;
  readonly #fetch: typeof fetch;

  constructor(options: GeminiOptions) {
    this.modelId = options.model ?? GEMINI_DEFAULT_MODEL;
    this.#fallbacks = (options.fallbackModels ?? []).filter((m) => m && m !== this.modelId);
    this.#apiKey = options.apiKey;
    this.#fetch = options.fetch ?? ((input, init) => fetch(input, init));
  }

  async generateDraft(context: DraftContext): Promise<ModelDraftResult> {
    const prompt = buildDraftPrompt(context);
    return this.#withFallback(async (model) => ({
      ...parseModelOutput(await this.#call(model, prompt, DRAFT_SCHEMA, 2048)),
      modelId: model,
    }));
  }

  async suggestFacts(resumeText: string): Promise<SuggestedFact[]> {
    const prompt = buildFactPrompt(resumeText);
    return this.#withFallback(async (model) => parseFactOutput(await this.#call(model, prompt, FACTS_SCHEMA, 4096)));
  }

  /** Try the preferred model, then each fallback, while the failure is overload or rate limiting. */
  async #withFallback<T>(run: (model: string) => Promise<T>): Promise<T> {
    const models = [this.modelId, ...this.#fallbacks];
    for (const [i, model] of models.entries()) {
      try {
        return await run(model);
      } catch (err) {
        const retryable = err instanceof ModelUnavailableError && (err.reason === "unavailable" || err.reason === "rate_limited");
        if (!retryable || i === models.length - 1) throw err;
      }
    }
    throw new ModelUnavailableError("unavailable", "No Gemini model is configured.");
  }

  /** One Interactions API call; returns the output text. */
  async #call(model: string, prompt: DraftPrompt, schema: object, maxOutputTokens: number): Promise<string> {
    let response: Response;
    try {
      response = await this.#fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": this.#apiKey },
        body: JSON.stringify({
          model,
          system_instruction: prompt.system,
          input: prompt.user,
          store: false,
          generation_config: { thinking_level: "low", max_output_tokens: maxOutputTokens },
          response_format: { type: "text", mime_type: "application/json", schema },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new ModelUnavailableError("unavailable", "Couldn't reach Gemini. Check your connection and try again.");
    }

    if (!response.ok) throw httpError(response.status);
    const interaction = (await response.json().catch(() => {
      throw new ModelOutputError("Gemini returned invalid JSON.");
    })) as InteractionResponse;
    return outputText(interaction);
  }
}

function httpError(status: number): ModelUnavailableError {
  if (status === 429) {
    return new ModelUnavailableError("rate_limited", "Gemini's free-tier limit was reached. Wait a minute and try again.");
  }
  if (status === 401 || status === 403) {
    return new ModelUnavailableError("auth", "Gemini rejected the API key. Check GEMINI_API_KEY in workers/api/.dev.vars.");
  }
  if (status === 400 || status === 404) {
    return new ModelUnavailableError("not_configured", "Gemini rejected the request. Check GEMINI_MODEL is a current model id.");
  }
  return new ModelUnavailableError("unavailable", `Gemini is unavailable right now (HTTP ${status}). Try again.`);
}

/** Text of the last model_output step; incomplete or failed interactions are errors. */
function outputText(interaction: InteractionResponse): string {
  if (interaction.status === "incomplete") throw new ModelOutputError("Gemini stopped before finishing the draft.");
  if (interaction.status && interaction.status !== "completed") {
    throw new ModelOutputError(`Gemini returned status "${interaction.status}".`);
  }
  const output = (interaction.steps ?? []).filter((s) => s.type === "model_output").at(-1);
  const text = (output?.content ?? [])
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("");
  if (!text.trim()) throw new ModelOutputError("Gemini returned no text.");
  return text;
}

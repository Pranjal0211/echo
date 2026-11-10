import {
  type DraftContext,
  type DraftModel,
  type ModelDraftResult,
  ModelOutputError,
  ModelUnavailableError,
} from "./model.ts";
import { buildDraftPrompt, parseModelOutput } from "./prompt.ts";

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
export class GeminiDraftModel implements DraftModel {
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
    const models = [this.modelId, ...this.#fallbacks];
    for (const [i, model] of models.entries()) {
      try {
        return { ...(await this.#call(model, prompt)), modelId: model };
      } catch (err) {
        const retryable = err instanceof ModelUnavailableError && (err.reason === "unavailable" || err.reason === "rate_limited");
        if (!retryable || i === models.length - 1) throw err;
      }
    }
    throw new ModelUnavailableError("unavailable", "No Gemini model is configured.");
  }

  async #call(model: string, prompt: { system: string; user: string }) {
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
          generation_config: { thinking_level: "low", max_output_tokens: 2048 },
          response_format: { type: "text", mime_type: "application/json", schema: DRAFT_SCHEMA },
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
    return parseModelOutput(outputText(interaction));
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

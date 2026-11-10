import {
  ApiError,
  DraftResponse,
  InboxItem,
  InboxResponse,
  ProfileResponse,
  SuggestFactsResponse,
  type CreateConversationRequest,
  type CreateFactRequest,
  type CreateStyleExampleRequest,
  type GenerateDraftRequest,
  type UpdateDraftRequest,
  type UpdateFactRequest,
  type UpdateProfileRequest,
} from "@echo/contracts";
import type { z } from "zod";

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/** Fetch JSON and validate it against the shared contract, so UI never trusts a bad shape. */
async function request<S extends z.ZodType>(path: string, schema: S, init?: RequestInit): Promise<z.infer<S>> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiClientError(0, "network", "Can't reach the Echo API. Is `npm run dev` running?");
  }
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = ApiError.safeParse(json);
    throw new ApiClientError(
      res.status,
      parsed.success ? parsed.data.error.code : "unknown",
      parsed.success ? parsed.data.error.message : `Request failed (${res.status}).`,
    );
  }
  return schema.parse(json);
}

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });
const patch = (body: unknown): RequestInit => ({ method: "PATCH", body: JSON.stringify(body) });
const del: RequestInit = { method: "DELETE" };

export const api = {
  inbox: () => request("/api/inbox", InboxResponse),
  profile: () => request("/api/profile", ProfileResponse),
  createConversation: (body: CreateConversationRequest) => request("/api/conversations", InboxItem, post(body)),
  generateDraft: (body: GenerateDraftRequest) => request("/api/drafts/generate", DraftResponse, post(body)),
  updateDraft: (id: string, body: UpdateDraftRequest) =>
    request(`/api/drafts/${id}`, DraftResponse, { method: "PATCH", body: JSON.stringify(body) }),
  copyDraft: (id: string, version: number) => request(`/api/drafts/${id}/copy`, DraftResponse, post({ version })),
  markSent: (id: string, version: number) => request(`/api/drafts/${id}/mark-sent`, DraftResponse, post({ version })),
  updateProfile: (body: UpdateProfileRequest) => request("/api/profile", ProfileResponse, patch(body)),
  addFact: (body: CreateFactRequest) => request("/api/profile/facts", ProfileResponse, post(body)),
  updateFact: (id: string, body: UpdateFactRequest) => request(`/api/profile/facts/${encodeURIComponent(id)}`, ProfileResponse, patch(body)),
  deleteFact: (id: string) => request(`/api/profile/facts/${encodeURIComponent(id)}`, ProfileResponse, del),
  suggestFacts: (resumeText: string) => request("/api/profile/facts/suggest", SuggestFactsResponse, post({ resumeText })),
  addStyleExample: (body: CreateStyleExampleRequest) => request("/api/profile/examples", ProfileResponse, post(body)),
  deleteStyleExample: (id: string) => request(`/api/profile/examples/${encodeURIComponent(id)}`, ProfileResponse, del),
};

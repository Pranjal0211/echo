import {
  ApiError,
  DraftResponse,
  InboxItem,
  InboxResponse,
  ProfileResponse,
  type CreateConversationRequest,
  type GenerateDraftRequest,
  type UpdateDraftRequest,
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

export const api = {
  inbox: () => request("/api/inbox", InboxResponse),
  profile: () => request("/api/profile", ProfileResponse),
  createConversation: (body: CreateConversationRequest) => request("/api/conversations", InboxItem, post(body)),
  generateDraft: (body: GenerateDraftRequest) => request("/api/drafts/generate", DraftResponse, post(body)),
  updateDraft: (id: string, body: UpdateDraftRequest) =>
    request(`/api/drafts/${id}`, DraftResponse, { method: "PATCH", body: JSON.stringify(body) }),
  copyDraft: (id: string, version: number) => request(`/api/drafts/${id}/copy`, DraftResponse, post({ version })),
  markSent: (id: string, version: number) => request(`/api/drafts/${id}/mark-sent`, DraftResponse, post({ version })),
};

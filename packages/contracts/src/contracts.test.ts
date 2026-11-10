import { describe, expect, it } from "vitest";
import {
  CreateConversationRequest,
  Draft,
  GenerateDraftRequest,
  MAX_MESSAGE_CHARS,
  ModelDraftOutput,
  UpdateDraftRequest,
} from "./index.ts";

const validPaste = {
  channel: "linkedin",
  contact: { name: "Alex Rivera", relationship: "recruiter" },
  message: "Hi! Are you open to a quick chat about a frontend role?",
};

describe("CreateConversationRequest", () => {
  it("accepts a pasted LinkedIn message", () => {
    expect(CreateConversationRequest.safeParse(validPaste).success).toBe(true);
  });

  it("rejects an empty message after trimming", () => {
    const result = CreateConversationRequest.safeParse({ ...validPaste, message: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects messages over the size limit", () => {
    const result = CreateConversationRequest.safeParse({
      ...validPaste,
      message: "a".repeat(MAX_MESSAGE_CHARS + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown channels", () => {
    const result = CreateConversationRequest.safeParse({ ...validPaste, channel: "slack" });
    expect(result.success).toBe(false);
  });
});

describe("GenerateDraftRequest", () => {
  it("caps free-text instructions", () => {
    const result = GenerateDraftRequest.safeParse({
      conversationId: "c1",
      intent: "interested",
      tone: "warm",
      length: "short",
      instructions: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateDraftRequest", () => {
  it("requires the version being edited", () => {
    expect(UpdateDraftRequest.safeParse({ body: "Hi" }).success).toBe(false);
    expect(UpdateDraftRequest.safeParse({ body: "Hi", expectedVersion: 1 }).success).toBe(true);
  });
});

describe("ModelDraftOutput", () => {
  it("rejects model output without a body", () => {
    const result = ModelDraftOutput.safeParse({
      subject: null,
      body: "",
      factIdsUsed: [],
      warnings: [],
      decisionsNeeded: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("Draft", () => {
  const validDraft = {
    id: "d1",
    conversationId: "c1",
    channel: "linkedin",
    deliveryCapability: "copy_only",
    intent: "interested",
    tone: "warm",
    length: "short",
    subject: null,
    body: "Hi",
    version: 1,
    status: "generated",
    factIdsUsed: [],
    warnings: [],
    decisionsNeeded: [],
    modelId: "fake",
    createdAt: "2026-11-01T09:00:00.000Z",
    updatedAt: "2026-11-01T09:00:00.000Z",
  } as const;

  it("accepts matching channel and delivery capabilities", () => {
    expect(Draft.safeParse(validDraft).success).toBe(true);
    expect(
      Draft.safeParse({ ...validDraft, channel: "gmail", deliveryCapability: "provider_send" }).success,
    ).toBe(true);
  });

  it("rejects a LinkedIn draft with provider sending", () => {
    expect(
      Draft.safeParse({ ...validDraft, deliveryCapability: "provider_send" }).success,
    ).toBe(false);
  });

  it("rejects a Gmail draft with copy-only delivery", () => {
    expect(
      Draft.safeParse({
        ...validDraft,
        channel: "gmail",
        deliveryCapability: "copy_only",
      }).success,
    ).toBe(false);
  });
});

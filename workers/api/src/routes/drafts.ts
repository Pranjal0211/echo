import { Hono } from "hono";
import {
  DraftVersionRequest,
  GenerateDraftRequest,
  ModelDraftOutput,
  UpdateDraftRequest,
  type Draft,
} from "@echo/contracts";
import { detectDecisionsNeeded, ModelOutputError } from "@echo/ai";
import {
  applyEdit,
  assertCanDraftFor,
  deliveryCapabilityFor,
  enforceGrounding,
  markCopied,
  markSentManually,
  selectUsableFacts,
} from "@echo/core";
import type { AppDeps } from "../deps.ts";
import { notFound, parseBody, toErrorResponse } from "../http.ts";

export function draftRoutes({ store, model, now, newId }: AppDeps) {
  const routes = new Hono();
  routes.onError(toErrorResponse);

  async function loadDraft(id: string): Promise<Draft> {
    const draft = await store.getDraft(id);
    if (!draft) throw notFound("Draft");
    return draft;
  }

  /**
   * Generate a draft reply. Workflow from PRD §8.3: load context → policy-filter facts →
   * model → validate → enforce grounding → add decisions only the owner can make → save.
   */
  routes.post("/drafts/generate", async (c) => {
    const req = await parseBody(c, GenerateDraftRequest);
    const conversation = await store.getConversation(req.conversationId);
    if (!conversation) throw notFound("Conversation");
    const contact = await store.getContact(conversation.contactId);
    if (!contact) throw notFound("Contact");
    assertCanDraftFor(contact);

    const profile = await store.getProfile();
    const facts = selectUsableFacts(profile.facts);
    const raw = await model.generateDraft({
      channel: conversation.channel,
      intent: req.intent,
      tone: req.tone,
      length: req.length,
      instructions: req.instructions,
      contact,
      conversation,
      profile,
      facts,
    });
    const parsed = ModelDraftOutput.safeParse(raw);
    if (!parsed.success) throw new ModelOutputError(parsed.error.message);
    const output = enforceGrounding(parsed.data, facts);

    const lastInbound = [...conversation.messages].reverse().find((m) => m.direction === "inbound");
    const decisionsNeeded = [
      ...new Set([...output.decisionsNeeded, ...(lastInbound ? detectDecisionsNeeded(lastInbound.content) : [])]),
    ];

    const at = now().toISOString();
    const draft: Draft = {
      id: newId(),
      conversationId: conversation.id,
      channel: conversation.channel,
      deliveryCapability: deliveryCapabilityFor(conversation.channel),
      intent: req.intent,
      tone: req.tone,
      length: req.length,
      subject: conversation.channel === "gmail" ? output.subject : null,
      body: output.body,
      version: 1,
      status: "generated",
      factIdsUsed: output.factIdsUsed,
      warnings: output.warnings,
      decisionsNeeded,
      modelId: model.modelId,
      createdAt: at,
      updatedAt: at,
    };
    await store.saveDraft(draft);
    return c.json({ draft }, 201);
  });

  /** Edit text; creates a new version. 409 if someone edited a newer version first. */
  routes.patch("/drafts/:id", async (c) => {
    const req = await parseBody(c, UpdateDraftRequest);
    const draft = applyEdit(await loadDraft(c.req.param("id")), req, req.expectedVersion, now().toISOString());
    await store.saveDraft(draft);
    return c.json({ draft });
  });

  /** The owner copied this exact version to paste into LinkedIn. */
  routes.post("/drafts/:id/copy", async (c) => {
    const req = await parseBody(c, DraftVersionRequest);
    const draft = markCopied(await loadDraft(c.req.param("id")), req.version, now().toISOString());
    await store.saveDraft(draft);
    return c.json({ draft });
  });

  /**
   * The owner says they sent it. Echo records the reply and the thread is now
   * waiting on them; Echo never claims delivery itself.
   */
  routes.post("/drafts/:id/mark-sent", async (c) => {
    const req = await parseBody(c, DraftVersionRequest);
    const at = now().toISOString();
    const draft = markSentManually(await loadDraft(c.req.param("id")), req.version, at);
    const conversation = await store.getConversation(draft.conversationId);
    if (!conversation) throw notFound("Conversation");
    conversation.messages.push({ id: newId(), direction: "outbound", content: draft.body, occurredAt: at });
    conversation.waitingOn = "them";
    conversation.waitingSince = at;
    await store.saveDraft(draft);
    await store.saveConversation(conversation);
    return c.json({ draft });
  });

  return routes;
}

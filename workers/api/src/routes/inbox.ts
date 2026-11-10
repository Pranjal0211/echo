import { Hono } from "hono";
import {
  CreateConversationRequest,
  type Contact,
  type Conversation,
  type InboxItem,
} from "@echo/contracts";
import { compareByWaiting } from "@echo/core";
import type { AppDeps } from "../deps.ts";
import { notFound, parseBody, toErrorResponse } from "../http.ts";

export function inboxRoutes({ store, now, newId }: AppDeps) {
  const routes = new Hono();
  routes.onError(toErrorResponse);

  /** Conversations as the inbox shows them: waiting on me first, oldest first. */
  routes.get("/inbox", async (c) => {
    const conversations = (await store.listConversations()).sort(compareByWaiting);
    const items: InboxItem[] = [];
    for (const conversation of conversations) {
      const contact = await store.getContact(conversation.contactId);
      if (!contact) throw notFound(`Contact for conversation ${conversation.id}`);
      items.push({ conversation, contact, latestDraft: await store.latestDraftFor(conversation.id) });
    }
    return c.json({ items });
  });

  /** Paste a message someone sent me. It starts out waiting on me. */
  routes.post("/conversations", async (c) => {
    const body = await parseBody(c, CreateConversationRequest);
    const at = now().toISOString();
    const contact: Contact = {
      id: newId(),
      name: body.contact.name,
      company: body.contact.company || null,
      role: body.contact.role || null,
      relationship: body.contact.relationship,
      verifiedEmail: null,
      linkedinUrl: null,
      optOut: false,
    };
    const conversation: Conversation = {
      id: newId(),
      channel: body.channel,
      contactId: contact.id,
      subject: body.subject || null,
      importSource: "pasted",
      waitingOn: "me",
      waitingSince: at,
      messages: [{ id: newId(), direction: "inbound", content: body.message, occurredAt: at }],
    };
    await store.saveContact(contact);
    await store.saveConversation(conversation);
    const item: InboxItem = { conversation, contact, latestDraft: null };
    return c.json(item, 201);
  });

  return routes;
}

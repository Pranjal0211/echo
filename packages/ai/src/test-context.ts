import type { DraftContext } from "./model.ts";

export function makeContext(overrides: Partial<DraftContext> = {}): DraftContext {
  return {
    channel: "linkedin",
    intent: "interested",
    tone: "friendly_professional",
    length: "medium",
    contact: {
      id: "p1",
      name: "Alex Rivera",
      company: "Northwind",
      role: "Recruiter",
      relationship: "recruiter",
      verifiedEmail: null,
      linkedinUrl: null,
      optOut: false,
    },
    conversation: {
      id: "c1",
      channel: "linkedin",
      contactId: "p1",
      subject: null,
      importSource: "pasted",
      waitingOn: "me",
      waitingSince: "2026-11-01T09:00:00.000Z",
      messages: [
        { id: "m1", direction: "inbound", content: "Hi! Open to a frontend role?", occurredAt: "2026-11-01T09:00:00.000Z" },
      ],
    },
    profile: {
      name: "Jordan Demo",
      headline: "Frontend engineer",
      styleNotes: ["short", "warm"],
      styleExamples: [{ id: "s1", situation: "recruiter reply", text: "Thanks for reaching out!" }],
    },
    facts: [{ id: "f1", text: "Four years building React apps", category: "experience", verified: true, sensitivity: "normal" }],
    ...overrides,
  };
}

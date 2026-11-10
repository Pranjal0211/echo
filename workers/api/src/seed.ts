import type { Contact, Conversation, Profile } from "@echo/contracts";

/**
 * Entirely made-up people and companies (example.com addresses) for local dev and demos.
 * Never put real messages, contacts or resumes here.
 */
export interface SeedData {
  profile: Profile;
  contacts: Contact[];
  conversations: Conversation[];
}

const HOUR = 60 * 60 * 1000;

export function buildSeed(now: Date): SeedData {
  const ago = (hours: number) => new Date(now.getTime() - hours * HOUR).toISOString();

  const profile: Profile = {
    name: "Jordan Lee",
    headline: "Frontend engineer (demo profile)",
    styleNotes: ["Short and warm", "Direct, no corporate filler", "Never 'I hope this finds you well'"],
    facts: [
      { id: "fact-react", text: "Four years building production React and TypeScript apps", category: "experience", verified: true, sensitivity: "normal" },
      { id: "fact-playwright", text: "Built the end-to-end Playwright test suite for a payments dashboard", category: "project", verified: true, sensitivity: "normal" },
      { id: "fact-design-system", text: "Led a design-system migration across three product teams", category: "project", verified: true, sensitivity: "normal" },
      { id: "fact-rust", text: "Production Rust experience", category: "skill", verified: false, sensitivity: "normal" },
      { id: "fact-visa", text: "Will need visa sponsorship", category: "other", verified: true, sensitivity: "ask_every_time" },
    ],
    styleExamples: [
      { id: "ex-recruiter", situation: "Replying to a recruiter", text: "Hi Maya, thanks for reaching out! The role sounds interesting. Could you share the team and next steps? Best, Jordan" },
      { id: "ex-referral", situation: "Thanking a referrer", text: "Thanks so much, Ravi, really appreciate you putting my name forward. I'll keep you posted! Jordan" },
    ],
  };

  const contacts: Contact[] = [
    { id: "contact-alex", name: "Alex Rivera", company: "Northwind Labs", role: "Technical Recruiter", relationship: "recruiter", verifiedEmail: "alex.rivera@example.com", linkedinUrl: null, optOut: false },
    { id: "contact-priya", name: "Priya Nair", company: "Lumen Health", role: "Talent Partner", relationship: "recruiter", verifiedEmail: null, linkedinUrl: null, optOut: false },
    { id: "contact-sam", name: "Sam Okafor", company: "Brightline", role: "Engineering Manager", relationship: "former_colleague", verifiedEmail: null, linkedinUrl: null, optOut: false },
    { id: "contact-dana", name: "Dana Kim", company: "Orbit Analytics", role: "Hiring Team", relationship: "hiring_manager", verifiedEmail: "dana.kim@example.com", linkedinUrl: null, optOut: false },
  ];

  const conversations: Conversation[] = [
    {
      id: "convo-alex",
      channel: "gmail",
      contactId: "contact-alex",
      subject: "Frontend Engineer opportunity at Northwind Labs",
      importSource: "pasted",
      waitingOn: "me",
      waitingSince: ago(74),
      messages: [
        { id: "msg-alex-1", direction: "inbound", occurredAt: ago(74), content: "Hi Jordan,\n\nWe're hiring a Frontend Engineer at Northwind Labs to build our customer dashboard in React and TypeScript. Your background looks like a strong match. Would you be available for a 20-minute call this week?\n\nBest,\nAlex" },
      ],
    },
    {
      id: "convo-priya",
      channel: "linkedin",
      contactId: "contact-priya",
      subject: null,
      importSource: "pasted",
      waitingOn: "me",
      waitingSince: ago(20),
      messages: [
        { id: "msg-priya-1", direction: "inbound", occurredAt: ago(20), content: "Hey Jordan! I came across your profile and think you'd be great for a Senior Frontend role on our patient-portal team. What are your salary expectations, and are you open to relocating to Boston?" },
      ],
    },
    {
      id: "convo-sam",
      channel: "linkedin",
      contactId: "contact-sam",
      subject: null,
      importSource: "pasted",
      waitingOn: "me",
      waitingSince: ago(5),
      messages: [
        { id: "msg-sam-1", direction: "inbound", occurredAt: ago(5), content: "Hey! Saw you're looking. We have a frontend opening on my team at Brightline. Happy to refer you if you're interested, just send me your resume." },
      ],
    },
    {
      id: "convo-dana",
      channel: "gmail",
      contactId: "contact-dana",
      subject: "Interview next steps",
      importSource: "pasted",
      waitingOn: "them",
      waitingSince: ago(50),
      messages: [
        { id: "msg-dana-1", direction: "inbound", occurredAt: ago(96), content: "Thanks for the chat earlier! We'd like to move forward with a technical interview." },
        { id: "msg-dana-2", direction: "outbound", occurredAt: ago(50), content: "Thanks Dana, that's great news! Looking forward to it. Best, Jordan" },
      ],
    },
  ];

  return { profile, contacts, conversations };
}

import type { Draft, InboxItem } from "@echo/contracts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReplyPanel } from "./reply-panel.tsx";

const AT = "2026-11-09T12:00:00.000Z";

function makeItem(channel: "gmail" | "linkedin", latestDraft: Draft | null = null): InboxItem {
  return {
    conversation: {
      id: "c1",
      channel,
      contactId: "p1",
      subject: channel === "gmail" ? "Frontend role" : null,
      importSource: "pasted",
      waitingOn: "me",
      waitingSince: AT,
      messages: [{ id: "m1", direction: "inbound", content: "Free for a call?", occurredAt: AT }],
    },
    contact: { id: "p1", name: "Sam Okafor", company: "Brightline", role: null, relationship: "former_colleague", verifiedEmail: channel === "gmail" ? "sam@example.com" : null, linkedinUrl: null, optOut: false },
    latestDraft,
  };
}

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: "d1",
    conversationId: "c1",
    channel: "linkedin",
    deliveryCapability: "copy_only",
    intent: "interested",
    tone: "friendly_professional",
    length: "medium",
    subject: null,
    body: "Hi Sam,\n\nYes please!\n\nBest,\nJordan",
    version: 1,
    status: "generated",
    factIdsUsed: ["f1"],
    warnings: [],
    decisionsNeeded: ["When are you available? Echo won't pick times for you."],
    modelId: "fake",
    createdAt: AT,
    updatedAt: AT,
    ...overrides,
  };
}

const facts = [{ id: "f1", text: "Four years of React", category: "experience" as const, verified: true, sensitivity: "normal" as const }];
const respond = (draft: Draft) => new Response(JSON.stringify({ draft }));

describe("ReplyPanel", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("drafts a reply and shows decisions and facts used", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => respond(makeDraft())));
    render(<ReplyPanel item={makeItem("linkedin")} facts={facts} onChanged={async () => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /Draft a reply/ }));
    expect(screen.getByLabelText("Draft text")).toHaveValue("Hi Sam,\n\nYes please!\n\nBest,\nJordan");
    expect(screen.getByText(/Echo won't pick times for you/)).toBeInTheDocument();
    expect(screen.getByText("Four years of React")).toBeInTheDocument();
  });

  it("never offers Approve & Send for LinkedIn", () => {
    render(<ReplyPanel item={makeItem("linkedin", makeDraft())} facts={facts} onChanged={async () => {}} />);
    expect(screen.getByRole("button", { name: /Copy for LinkedIn/ })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Approve/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mark as sent manually/ })).toBeDisabled();
  });

  it("copies, then lets me mark it sent", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respond(makeDraft({ status: "copied" })))
      .mockResolvedValueOnce(respond(makeDraft({ status: "sent_manually" })));
    vi.stubGlobal("fetch", fetchMock);
    const onChanged = vi.fn(async () => {});
    render(<ReplyPanel item={makeItem("linkedin", makeDraft())} facts={facts} onChanged={onChanged} />);

    await user.click(screen.getByRole("button", { name: /Copy for LinkedIn/ }));
    expect(await navigator.clipboard.readText()).toContain("Yes please!");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/drafts/d1/copy");

    await user.click(screen.getByRole("button", { name: /Mark as sent manually/ }));
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/drafts/d1/mark-sent");
    expect(screen.getByText(/now waiting on Sam Okafor/)).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledTimes(2);
  });

  it("saves my edits as a new version before copying", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respond(makeDraft({ body: "Hey Sam! Yes please.", version: 2, status: "edited" })))
      .mockResolvedValueOnce(respond(makeDraft({ body: "Hey Sam! Yes please.", version: 2, status: "copied" })));
    vi.stubGlobal("fetch", fetchMock);
    render(<ReplyPanel item={makeItem("linkedin", makeDraft())} facts={facts} onChanged={async () => {}} />);

    await user.clear(screen.getByLabelText("Draft text"));
    await user.type(screen.getByLabelText("Draft text"), "Hey Sam! Yes please.");
    await user.click(screen.getByRole("button", { name: /Copy for LinkedIn/ }));

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/drafts/d1");
    expect(JSON.parse(String(init.body))).toEqual({ body: "Hey Sam! Yes please.", expectedVersion: 1 });
    expect(JSON.parse(String((fetchMock.mock.calls[1] as [string, RequestInit])[1].body))).toEqual({ version: 2 });
  });

  it("shows the recipient and keeps Gmail sending disabled in Milestone 0", () => {
    const gmailDraft = makeDraft({ channel: "gmail", deliveryCapability: "provider_send", subject: "Re: Frontend role" });
    render(<ReplyPanel item={makeItem("gmail", gmailDraft)} facts={facts} onChanged={async () => {}} />);
    expect(screen.getByText(/sam@example.com/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Approve & Send/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Copy for LinkedIn/ })).not.toBeInTheDocument();
  });

  it("falls back to select-and-confirm when the clipboard is blocked", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new DOMException("denied", "NotAllowedError"));
    const fetchMock = vi.fn().mockResolvedValueOnce(respond(makeDraft({ status: "copied" })));
    vi.stubGlobal("fetch", fetchMock);
    render(<ReplyPanel item={makeItem("linkedin", makeDraft())} facts={facts} onChanged={async () => {}} />);

    await user.click(screen.getByRole("button", { name: /Copy for LinkedIn/ }));
    expect(screen.getByRole("status")).toHaveTextContent(/blocked automatic copying/);
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /I copied it/ }));
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/drafts/d1/copy");
    expect(screen.getByRole("button", { name: /Mark as sent manually/ })).toBeEnabled();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PasteMessageForm } from "./paste-message-form.tsx";

const created = {
  conversation: {
    id: "c9",
    channel: "linkedin",
    contactId: "p9",
    subject: null,
    importSource: "pasted",
    waitingOn: "me",
    waitingSince: "2026-11-09T12:00:00.000Z",
    messages: [{ id: "m9", direction: "inbound", content: "Hi there", occurredAt: "2026-11-09T12:00:00.000Z" }],
  },
  contact: { id: "p9", name: "Riley Chen", company: null, role: null, relationship: "recruiter", verifiedEmail: null, linkedinUrl: null, optOut: false },
  latestDraft: null,
};

describe("PasteMessageForm", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the pasted message to the API and reports the new conversation", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(created), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const onCreated = vi.fn();
    render(<PasteMessageForm onCreated={onCreated} onCancel={() => {}} />);

    await userEvent.type(screen.getByLabelText("Their name"), "Riley Chen");
    await userEvent.type(screen.getByLabelText("Their message"), "Hi there");
    await userEvent.click(screen.getByRole("button", { name: "Add to inbox" }));

    expect(onCreated).toHaveBeenCalledWith(created);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/conversations");
    expect(JSON.parse(String(init.body))).toEqual({
      channel: "linkedin",
      contact: { name: "Riley Chen", relationship: "recruiter" },
      message: "Hi there",
    });
  });

  it("asks for a subject only for Gmail", async () => {
    render(<PasteMessageForm onCreated={() => {}} onCancel={() => {}} />);
    expect(screen.queryByLabelText("Subject")).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Gmail"));
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
  });

  it("shows the API's error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: { code: "bad_request", message: "message: Too big" } }), { status: 400 })),
    );
    render(<PasteMessageForm onCreated={() => {}} onCancel={() => {}} />);
    await userEvent.type(screen.getByLabelText("Their name"), "Riley");
    await userEvent.type(screen.getByLabelText("Their message"), "Hi");
    await userEvent.click(screen.getByRole("button", { name: "Add to inbox" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("message: Too big");
  });
});

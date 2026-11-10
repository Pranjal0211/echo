import type { InboxItem } from "@echo/contracts";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InboxList } from "./inbox-list.tsx";

const NOW = new Date("2026-11-09T12:00:00.000Z");

function item(id: string, name: string, channel: "gmail" | "linkedin", waitingSince: string): InboxItem {
  return {
    conversation: {
      id,
      channel,
      contactId: `p-${id}`,
      subject: null,
      importSource: "pasted",
      waitingOn: "me",
      waitingSince,
      messages: [{ id: `m-${id}`, direction: "inbound", content: `Hello from ${name}`, occurredAt: waitingSince }],
    },
    contact: { id: `p-${id}`, name, company: "Acme", role: "Recruiter", relationship: "recruiter", verifiedEmail: null, linkedinUrl: null, optOut: false },
    latestDraft: null,
  };
}

describe("InboxList", () => {
  const items = [
    item("a", "Alex Rivera", "gmail", "2026-11-06T12:00:00.000Z"),
    item("b", "Sam Okafor", "linkedin", "2026-11-09T07:00:00.000Z"),
  ];

  it("shows how long each person has been waiting", () => {
    render(<InboxList items={items} selectedId={null} onSelect={() => {}} now={NOW} />);
    const rows = screen.getAllByRole("listitem");
    expect(within(rows[0]!).getByText(/Waiting on you · 3d/)).toBeInTheDocument();
    expect(within(rows[1]!).getByText(/Waiting on you · 5h/)).toBeInTheDocument();
    expect(within(rows[1]!).getByText("LinkedIn")).toBeInTheDocument();
  });

  it("selects a conversation on click", () => {
    const onSelect = vi.fn();
    render(<InboxList items={items} selectedId={null} onSelect={onSelect} now={NOW} />);
    screen.getByRole("button", { name: /Sam Okafor/ }).click();
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("has a helpful empty state", () => {
    render(<InboxList items={[]} selectedId={null} onSelect={() => {}} now={NOW} />);
    expect(screen.getByText(/Paste a message to get started/)).toBeInTheDocument();
  });
});

import type { DraftStatus, InboxItem } from "@echo/contracts";
import { cn } from "../lib.ts";
import { ChannelBadge } from "./channel-badge.tsx";
import { Badge } from "./ui/badge.tsx";
import { WaitingBadge } from "./waiting-badge.tsx";

const DRAFT_LABEL: Partial<Record<DraftStatus, string>> = {
  generated: "Draft ready",
  edited: "Draft edited",
  copied: "Copied",
  sent_manually: "Sent manually",
};

export function InboxList({
  items,
  selectedId,
  onSelect,
  now,
}: {
  items: InboxItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  now: Date;
}) {
  if (items.length === 0) {
    return <p className="p-6 text-sm text-muted">No conversations yet. Paste a message to get started.</p>;
  }
  return (
    <ul className="divide-y divide-line" aria-label="Conversations">
      {items.map(({ conversation, contact, latestDraft }) => {
        const last = conversation.messages.at(-1);
        const draftLabel = latestDraft ? DRAFT_LABEL[latestDraft.status] : undefined;
        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              aria-current={selectedId === conversation.id ? "true" : undefined}
              className={cn(
                "w-full px-4 py-3.5 text-left transition hover:bg-canvas",
                selectedId === conversation.id && "bg-brand-soft/60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{contact.name}</span>
                <ChannelBadge channel={conversation.channel} />
              </div>
              <p className="truncate text-xs text-muted">
                {[contact.role, contact.company].filter(Boolean).join(" · ") || contact.relationship.replace("_", " ")}
              </p>
              {conversation.subject && <p className="mt-1 truncate text-sm font-medium">{conversation.subject}</p>}
              {last && (
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {last.direction === "outbound" ? "You: " : ""}
                  {last.content}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <WaitingBadge conversation={conversation} now={now} />
                {draftLabel && <Badge tone="send">{draftLabel}</Badge>}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

import type { InboxItem } from "@echo/contracts";
import { cn } from "../lib.ts";
import { ChannelBadge } from "./channel-badge.tsx";
import { WaitingBadge } from "./waiting-badge.tsx";

const TIME = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function ConversationView({ item, now, children }: { item: InboxItem; now: Date; children?: React.ReactNode }) {
  const { conversation, contact } = item;
  return (
    <article className="flex min-w-0 flex-col gap-5" aria-label={`Conversation with ${contact.name}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{conversation.subject ?? contact.name}</h2>
          <p className="text-sm text-muted">
            {[
              conversation.subject ? contact.name : null,
              contact.role,
              contact.company && `at ${contact.company}`,
              contact.verifiedEmail,
            ]
              .filter(Boolean)
              .join(" · ") || contact.relationship.replace("_", " ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ChannelBadge channel={conversation.channel} />
          <WaitingBadge conversation={conversation} now={now} />
        </div>
      </header>

      <section aria-label="Messages" className="flex flex-col gap-3">
        {conversation.messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line",
              m.direction === "inbound" ? "self-start border border-line bg-surface" : "self-end bg-brand-soft",
            )}
          >
            <p className="mb-1 text-xs text-muted">
              {m.direction === "inbound" ? contact.name : "You"} · {TIME.format(new Date(m.occurredAt))}
            </p>
            {m.content}
          </div>
        ))}
      </section>

      {children}
    </article>
  );
}

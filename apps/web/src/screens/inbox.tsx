import type { InboxItem } from "@echo/contracts";
import { useState } from "react";
import { ConversationView } from "../components/conversation-view.tsx";
import { InboxList } from "../components/inbox-list.tsx";

export function InboxScreen({
  items,
  loading,
  error,
  now,
}: {
  items: InboxItem[];
  loading: boolean;
  error: string | null;
  now: Date;
  onChanged: () => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((i) => i.conversation.id === selectedId) ?? items[0] ?? null;

  return (
    <section className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Inbox</h1>
          <p className="text-sm text-muted">Oldest first. Echo drafts; you decide and send.</p>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid flex-1 gap-4 md:grid-cols-[minmax(260px,340px)_1fr]">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface md:max-h-[calc(100vh-8rem)] md:overflow-y-auto">
          {loading ? (
            <p className="p-6 text-sm text-muted">Loading…</p>
          ) : (
            <InboxList items={items} selectedId={selected?.conversation.id ?? null} onSelect={setSelectedId} now={now} />
          )}
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 md:p-6">
          {selected ? (
            <ConversationView item={selected} now={now} />
          ) : (
            <p className="text-sm text-muted">Select a conversation.</p>
          )}
        </div>
      </div>
    </section>
  );
}

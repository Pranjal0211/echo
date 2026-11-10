import type { InboxItem, ProfileFact } from "@echo/contracts";
import { useState } from "react";
import { ConversationView } from "../components/conversation-view.tsx";
import { InboxList } from "../components/inbox-list.tsx";
import { PasteMessageForm } from "../components/paste-message-form.tsx";
import { ReplyPanel } from "../components/reply-panel.tsx";
import { Button } from "../components/ui/button.tsx";
import { ClipboardPaste } from "lucide-react";

export function InboxScreen({
  items,
  loading,
  error,
  now,
  onChanged,
  facts,
}: {
  facts: ProfileFact[];
  items: InboxItem[];
  loading: boolean;
  error: string | null;
  now: Date;
  onChanged: () => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pasting, setPasting] = useState(false);
  const selected = items.find((i) => i.conversation.id === selectedId) ?? items[0] ?? null;

  return (
    <section className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Inbox</h1>
          <p className="text-sm text-muted">Oldest first. Echo drafts; you decide and send.</p>
        </div>
        {!pasting && (
          <Button variant="primary" onClick={() => setPasting(true)}>
            <ClipboardPaste className="size-4" aria-hidden /> Paste a message
          </Button>
        )}
      </header>

      {pasting && (
        <PasteMessageForm
          onCancel={() => setPasting(false)}
          onCreated={async (item) => {
            setPasting(false);
            await onChanged();
            setSelectedId(item.conversation.id);
          }}
        />
      )}

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
            <ConversationView item={selected} now={now}>
              <ReplyPanel key={selected.conversation.id} item={selected} facts={facts} onChanged={onChanged} />
            </ConversationView>
          ) : (
            <p className="text-sm text-muted">Select a conversation.</p>
          )}
        </div>
      </div>
    </section>
  );
}

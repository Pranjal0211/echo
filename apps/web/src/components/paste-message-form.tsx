import { Relationship, type Channel, type InboxItem } from "@echo/contracts";
import { useState, type FormEvent } from "react";
import { api } from "../api.ts";
import { Button } from "./ui/button.tsx";

const field = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm";
const label = "flex flex-col gap-1 text-sm font-medium";

/** Paste a message someone sent me (LinkedIn or Gmail). It lands in the inbox as waiting on me. */
export function PasteMessageForm({ onCreated, onCancel }: { onCreated: (item: InboxItem) => void; onCancel: () => void }) {
  const [channel, setChannel] = useState<Channel>("linkedin");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? "").trim();
    setSaving(true);
    setError(null);
    try {
      const item = await api.createConversation({
        channel,
        contact: {
          name: text("name"),
          company: text("company") || undefined,
          role: text("role") || undefined,
          relationship: Relationship.parse(text("relationship")),
        },
        subject: channel === "gmail" ? text("subject") || undefined : undefined,
        message: text("message"),
      });
      onCreated(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the message.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} aria-label="Paste a message" className="grid gap-4 rounded-2xl border border-line bg-surface p-4 md:p-6">
      <fieldset className="flex gap-2">
        <legend className="mb-2 text-sm font-medium">Where did it come from?</legend>
        {(["linkedin", "gmail"] as const).map((c) => (
          <label key={c} className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm has-checked:border-brand has-checked:bg-brand-soft">
            <input type="radio" name="channel" value={c} checked={channel === c} onChange={() => setChannel(c)} />
            {c === "linkedin" ? "LinkedIn" : "Gmail"}
          </label>
        ))}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          Their name
          <input name="name" required maxLength={200} className={field} />
        </label>
        <label className={label}>
          Relationship
          <select name="relationship" defaultValue="recruiter" className={field}>
            {Relationship.options.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Company <span className="sr-only">(optional)</span>
          <input name="company" maxLength={200} className={field} />
        </label>
        <label className={label}>
          Role <span className="sr-only">(optional)</span>
          <input name="role" maxLength={200} className={field} />
        </label>
        {channel === "gmail" && (
          <label className={`${label} sm:col-span-2`}>
            Subject
            <input name="subject" maxLength={300} className={field} />
          </label>
        )}
      </div>

      <label className={label}>
        Their message
        <textarea name="message" required rows={6} className={field} placeholder="Paste the message here" />
      </label>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Add to inbox"}
        </Button>
      </div>
    </form>
  );
}

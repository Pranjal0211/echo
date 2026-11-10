import { FactCategory, type Profile, type ProfileFact } from "@echo/contracts";
import { Check, Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api } from "../../api.ts";
import { useAction } from "../../hooks.ts";
import { Badge } from "../ui/badge.tsx";
import { Button } from "../ui/button.tsx";
import { CATEGORIES, CATEGORY_LABEL, field } from "./form-styles.ts";

/** One fact: read it, approve it if it's a suggestion, edit or delete it. */
export function FactRow({ fact, onSaved }: { fact: ProfileFact; onSaved: (profile: Profile) => void }) {
  const [editing, setEditing] = useState(false);
  const { run, busy, error } = useAction();

  async function act(action: () => Promise<{ profile: Profile }>) {
    const result = await run(action);
    if (result) {
      setEditing(false);
      onSaved(result.profile);
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void act(() =>
      api.updateFact(fact.id, {
        text: String(data.get("text") ?? ""),
        category: FactCategory.parse(data.get("category")),
        sensitivity: data.get("sensitive") ? "ask_every_time" : "normal",
      }),
    );
  }

  return (
    <li className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0">
      {editing ? (
        <form onSubmit={save} aria-label="Edit fact" className="grid gap-2">
          <textarea name="text" required maxLength={500} rows={2} defaultValue={fact.text} aria-label="Fact" className={field} />
          <div className="flex flex-wrap items-center gap-3">
            <select name="category" defaultValue={fact.category} aria-label="Category" className={`${field} w-auto`}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="sensitive" defaultChecked={fact.sensitivity === "ask_every_time"} />
              Ask me every time
            </label>
            <span className="ml-auto flex gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={busy}>
                Save
              </Button>
            </span>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <p className="min-w-0 flex-1 basis-64 text-sm">{fact.text}</p>
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge>{CATEGORY_LABEL[fact.category]}</Badge>
            {fact.sensitivity === "ask_every_time" && <Badge tone="warn">Ask every time</Badge>}
          </span>
          <span className="flex gap-1">
            {!fact.verified && (
              <Button
                variant="primary"
                aria-label={`Approve: ${fact.text}`}
                disabled={busy}
                onClick={() => act(() => api.updateFact(fact.id, { verified: true }))}
              >
                <Check className="size-4" aria-hidden /> Approve
              </Button>
            )}
            <Button variant="ghost" aria-label={`Edit: ${fact.text}`} onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden />
            </Button>
            <Button variant="ghost" aria-label={`Delete: ${fact.text}`} disabled={busy} onClick={() => act(() => api.deleteFact(fact.id))}>
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </span>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </li>
  );
}

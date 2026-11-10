import type { Profile } from "@echo/contracts";
import { Plus, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { api } from "../../api.ts";
import { useAction } from "../../hooks.ts";
import { Button } from "../ui/button.tsx";
import { card, field } from "./form-styles.ts";

/** Real messages the owner wrote. Drafts copy their voice from these (ROAST R4). */
export function StyleExamples({ profile, onSaved }: { profile: Profile; onSaved: (profile: Profile) => void }) {
  const { run, busy, error } = useAction();

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await run(() =>
      api.addStyleExample({ situation: String(data.get("situation") ?? ""), text: String(data.get("text") ?? "") }),
    );
    if (result) {
      form.reset();
      onSaved(result.profile);
    }
  }

  async function remove(id: string) {
    const result = await run(() => api.deleteStyleExample(id));
    if (result) onSaved(result.profile);
  }

  return (
    <section aria-labelledby="examples-heading" className={`${card} grid gap-3`}>
      <div>
        <h2 id="examples-heading" className="font-semibold">
          Messages you wrote
        </h2>
        <p className="text-sm text-muted">Paste 5–10 replies you've sent. Drafts copy your voice from them.</p>
      </div>
      {profile.styleExamples.length === 0 ? (
        <p className="text-sm text-muted">No examples yet.</p>
      ) : (
        <ul className="grid gap-2">
          {profile.styleExamples.map((e) => (
            <li key={e.id} className="rounded-xl bg-canvas p-3">
              <div className="flex items-start gap-2">
                <p className="flex-1 text-xs font-medium text-muted">{e.situation}</p>
                <Button variant="ghost" className="-m-1.5 p-1.5" aria-label={`Delete example: ${e.situation}`} disabled={busy} onClick={() => remove(e.id)}>
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm">{e.text}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} aria-label="Add a message you wrote" className="grid gap-2 border-t border-line pt-3">
        <input name="situation" required maxLength={200} aria-label="Situation" placeholder="Situation, e.g. Thanking a referrer" className={field} />
        <textarea name="text" required maxLength={2000} rows={3} aria-label="Message" placeholder="The message you sent" className={field} />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button variant="outline" type="submit" disabled={busy}>
            <Plus className="size-4" aria-hidden /> Add example
          </Button>
        </div>
      </form>
    </section>
  );
}

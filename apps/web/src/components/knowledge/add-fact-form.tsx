import { FactCategory, type Profile } from "@echo/contracts";
import { Plus } from "lucide-react";
import type { FormEvent } from "react";
import { api } from "../../api.ts";
import { useAction } from "../../hooks.ts";
import { Button } from "../ui/button.tsx";
import { CATEGORIES, CATEGORY_LABEL, field } from "./form-styles.ts";

/** Type a fact yourself. It's yours, so it starts approved. */
export function AddFactForm({ onSaved }: { onSaved: (profile: Profile) => void }) {
  const { run, busy, error } = useAction();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await run(() =>
      api.addFact({
        text: String(data.get("text") ?? ""),
        category: FactCategory.parse(data.get("category")),
        sensitivity: data.get("sensitive") ? "ask_every_time" : "normal",
      }),
    );
    if (result) {
      form.reset();
      onSaved(result.profile);
    }
  }

  return (
    <form onSubmit={submit} aria-label="Add a fact" className="grid gap-2 border-t border-line pt-3">
      <input name="text" required maxLength={500} aria-label="New fact" placeholder="Add a fact, e.g. Led a team of four engineers" className={field} />
      <div className="flex flex-wrap items-center gap-3">
        <select name="category" defaultValue="experience" aria-label="Category" className={`${field} w-auto`}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="sensitive" />
          Ask me every time
        </label>
        <Button variant="outline" type="submit" disabled={busy} className="ml-auto">
          <Plus className="size-4" aria-hidden /> Add fact
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

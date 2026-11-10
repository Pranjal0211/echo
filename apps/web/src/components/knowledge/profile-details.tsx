import type { Profile } from "@echo/contracts";
import type { FormEvent } from "react";
import { useState } from "react";
import { api } from "../../api.ts";
import { useAction } from "../../hooks.ts";
import { Button } from "../ui/button.tsx";
import { card, field, label } from "./form-styles.ts";

const notesFrom = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * Name, headline and style notes. With no profile yet (fresh database) this is the
 * setup form, and saving creates the profile.
 */
export function ProfileDetails({ profile, onSaved }: { profile: Profile | null; onSaved: (profile: Profile) => void }) {
  const { run, busy, error } = useAction();
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    const data = new FormData(event.currentTarget);
    const result = await run(() =>
      api.updateProfile({
        name: String(data.get("name") ?? "").trim(),
        headline: String(data.get("headline") ?? "").trim(),
        styleNotes: notesFrom(String(data.get("styleNotes") ?? "")),
      }),
    );
    if (result) {
      onSaved(result.profile);
      setSaved(true);
    }
  }

  return (
    <form onSubmit={submit} aria-label="Your profile" className={`${card} grid gap-3`}>
      <div>
        <h2 className="font-semibold">{profile ? "About you" : "Set up your profile"}</h2>
        {!profile && <p className="text-sm text-muted">Echo signs drafts with your name. Add facts once this is saved.</p>}
      </div>
      <label className={label}>
        Name
        <input name="name" required maxLength={200} defaultValue={profile?.name} className={field} />
      </label>
      <label className={label}>
        Headline
        <input name="headline" maxLength={200} defaultValue={profile?.headline} placeholder="e.g. Frontend engineer" className={field} />
      </label>
      <label className={label}>
        How you write
        <textarea
          name="styleNotes"
          rows={4}
          defaultValue={profile?.styleNotes.join("\n")}
          placeholder={"One note per line, e.g.\nShort and warm\nNo corporate filler"}
          className={field}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span role="status" className="text-sm text-send">
            Saved
          </span>
        )}
        <Button variant="primary" type="submit" disabled={busy}>
          {profile ? "Save" : "Create profile"}
        </Button>
      </div>
    </form>
  );
}

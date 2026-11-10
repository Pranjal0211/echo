import { MAX_RESUME_CHARS, type Profile } from "@echo/contracts";
import { Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api } from "../../api.ts";
import { useAction } from "../../hooks.ts";
import { Button } from "../ui/button.tsx";
import { card, field } from "./form-styles.ts";

/** Paste a resume; the model suggests facts, which wait unverified for the owner's review. */
export function ResumeImport({ onSaved }: { onSaved: (profile: Profile) => void }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const { run, busy, error } = useAction();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    const response = await run(() => api.suggestFacts(text));
    if (!response) return;
    onSaved(response.profile);
    setText("");
    const skipped = response.skipped > 0 ? ` Skipped ${response.skipped} (duplicates or contact details).` : "";
    setResult(
      response.added === 0
        ? `No new facts found.${skipped}`
        : `Added ${response.added} ${response.added === 1 ? "suggestion" : "suggestions"} to review.${skipped}`,
    );
  }

  return (
    <form onSubmit={submit} aria-label="Suggest facts from your resume" className={`${card} grid gap-3`}>
      <div>
        <h2 className="font-semibold">Add facts from your resume</h2>
        <p className="text-sm text-muted">
          Paste the text of your resume. Echo suggests facts; you approve each one before a draft can use it.
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
        maxLength={MAX_RESUME_CHARS}
        rows={6}
        aria-label="Resume text"
        placeholder="Paste your resume here"
        className={field}
      />
      <p className="text-xs text-muted">
        The text goes to the drafting model once and isn't saved. With Gemini's free tier, Google may use it to improve its
        products.
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {result && (
        <p role="status" className="text-sm text-send">
          {result}
        </p>
      )}
      <div className="flex justify-end">
        <Button variant="primary" type="submit" disabled={busy || !text.trim()}>
          <Sparkles className="size-4" aria-hidden /> {busy ? "Reading…" : "Suggest facts"}
        </Button>
      </div>
    </form>
  );
}

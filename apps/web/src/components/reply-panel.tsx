import type { Draft, InboxItem, Length, ProfileFact, ReplyIntent, Tone } from "@echo/contracts";
import { AlertTriangle, Check, Copy, HelpCircle, RefreshCw, Send, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { api } from "../api.ts";
import { cn } from "../lib.ts";
import { Badge } from "./ui/badge.tsx";
import { Button } from "./ui/button.tsx";

const INTENTS: ReadonlyArray<[ReplyIntent, string]> = [
  ["interested", "Interested"],
  ["need_details", "Need details"],
  ["not_now", "Not now"],
  ["not_interested", "Decline"],
  ["thanks", "Say thanks"],
  ["follow_up", "Follow up"],
];
const TONES: ReadonlyArray<[Tone, string]> = [
  ["friendly_professional", "Friendly professional"],
  ["warm", "Warm"],
  ["formal", "Formal"],
  ["casual", "Casual"],
];
const LENGTHS: ReadonlyArray<[Length, string]> = [
  ["short", "Short"],
  ["medium", "Medium"],
  ["long", "Long"],
];

const STATUS_LABEL: Partial<Record<Draft["status"], string>> = {
  generated: "Generated",
  edited: "Edited",
  copied: "Copied",
  sent_manually: "Sent manually",
};

const chip = "rounded-full border px-3 py-1 text-sm transition";

export function ReplyPanel({
  item,
  facts,
  onChanged,
}: {
  item: InboxItem;
  facts: ProfileFact[];
  onChanged: () => Promise<void>;
}) {
  const { conversation, contact } = item;
  const [intent, setIntent] = useState<ReplyIntent>("interested");
  const [tone, setTone] = useState<Tone>("friendly_professional");
  const [length, setLength] = useState<Length>("medium");
  const [instructions, setInstructions] = useState("");
  const [draft, setDraft] = useState<Draft | null>(item.latestDraft);
  const [text, setText] = useState(item.latestDraft?.body ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCopy, setManualCopy] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const dirty = draft !== null && text.trim() !== draft.body;
  const isLinkedIn = draft?.deliveryCapability === "copy_only";
  const finished = draft?.status === "sent_manually";

  async function run(label: string, action: () => Promise<void>) {
    setBusy(label);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  const show = (next: Draft) => {
    setDraft(next);
    setText(next.body);
  };

  /** Save pending edits first, so actions always apply to the text on screen. */
  async function saved(): Promise<Draft> {
    if (!draft) throw new Error("Generate a draft first.");
    if (!dirty) return draft;
    const { draft: next } = await api.updateDraft(draft.id, { body: text.trim(), expectedVersion: draft.version });
    show(next);
    return next;
  }

  const generate = () =>
    run("generate", async () => {
      const { draft: next } = await api.generateDraft({
        conversationId: conversation.id,
        intent,
        tone,
        length,
        instructions: instructions.trim() || undefined,
      });
      show(next);
      await onChanged();
    });

  /** Returns false when the browser blocks clipboard access; the text is then selected for ⌘C. */
  async function writeClipboard(value: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      textRef.current?.focus();
      textRef.current?.select();
      return false;
    }
  }

  const recordCopy = async (current: Draft) => {
    show((await api.copyDraft(current.id, current.version)).draft);
    setManualCopy(false);
    await onChanged();
  };

  const copyForLinkedIn = () =>
    run("copy", async () => {
      const current = await saved();
      if (await writeClipboard(current.body)) await recordCopy(current);
      else setManualCopy(true);
    });

  const confirmManualCopy = () => run("copy", async () => recordCopy(await saved()));

  const markSent = () =>
    run("sent", async () => {
      if (!draft) return;
      show((await api.markSent(draft.id, draft.version)).draft);
      await onChanged();
    });

  const copyText = () =>
    run("copy", async () => {
      if (!(await writeClipboard((await saved()).body))) setManualCopy(true);
    });

  const factsUsed = draft ? facts.filter((f) => draft.factIdsUsed.includes(f.id)) : [];

  return (
    <section aria-label="Reply" className="flex flex-col gap-4 border-t border-line pt-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-brand" aria-hidden />
        <h3 className="font-semibold">Your reply</h3>
        {draft && STATUS_LABEL[draft.status] && <Badge tone="send">{STATUS_LABEL[draft.status]}</Badge>}
        {draft && <span className="text-xs text-muted">v{draft.version}</span>}
      </div>

      {!finished && (
        <div className="flex flex-col gap-3">
          <div role="radiogroup" aria-label="What do you want to say?" className="flex flex-wrap gap-2">
            {INTENTS.map(([value, name]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={intent === value}
                onClick={() => setIntent(value)}
                className={cn(chip, intent === value ? "border-brand bg-brand-soft text-brand-ink" : "border-line text-muted hover:text-ink")}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              Tone
              <select value={tone} onChange={(e) => setTone(e.target.value as Tone)} className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm">
                {TONES.map(([value, name]) => (
                  <option key={value} value={value}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <div role="radiogroup" aria-label="Length" className="flex overflow-hidden rounded-lg border border-line">
              {LENGTHS.map(([value, name]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={length === value}
                  onClick={() => setLength(value)}
                  className={cn("px-3 py-1.5 text-sm", length === value ? "bg-brand-soft text-brand-ink" : "text-muted hover:text-ink")}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <input
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            maxLength={500}
            placeholder="Anything to add? e.g. mention I'm open to remote"
            aria-label="Extra instructions"
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          />
          <div>
            <Button variant="primary" onClick={generate} disabled={busy !== null}>
              {draft ? <RefreshCw className="size-4" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
              {busy === "generate" ? "Drafting…" : draft ? "Regenerate" : "Draft a reply"}
            </Button>
          </div>
        </div>
      )}

      {draft && (
        <>
          {draft.decisionsNeeded.length > 0 && !finished && (
            <div className="rounded-xl bg-warn-soft p-3 text-sm text-warn" aria-label="Only you can decide">
              <p className="flex items-center gap-1.5 font-medium">
                <HelpCircle className="size-4" aria-hidden /> Only you can decide
              </p>
              <ul className="mt-1 list-disc pl-6">
                {draft.decisionsNeeded.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}
          {draft.warnings.map((w) => (
            <p key={w} className="flex items-start gap-1.5 rounded-xl bg-danger-soft p-3 text-sm text-danger">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {w}
            </p>
          ))}

          {draft.subject && <p className="text-sm"><span className="text-muted">Subject:</span> {draft.subject}</p>}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            ref={textRef}
            readOnly={finished}
            rows={9}
            aria-label="Draft text"
            className="rounded-xl border border-line bg-surface p-3 text-sm leading-relaxed"
          />

          {factsUsed.length > 0 && (
            <div className="text-sm">
              <p className="font-medium">Facts used from your profile</p>
              <ul className="mt-1 flex flex-col gap-1 text-muted">
                {factsUsed.map((f) => (
                  <li key={f.id} className="flex items-start gap-1.5">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-send" aria-hidden /> {f.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          {manualCopy && !finished && (
            <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm text-brand-ink">
              Your browser blocked automatic copying. The text is selected: press ⌘C (or Ctrl+C)
              {isLinkedIn ? ', then click "I copied it".' : "."}
            </p>
          )}

          {finished ? (
            <p className="text-sm text-muted">You sent this yourself. The thread is now waiting on {contact.name}.</p>
          ) : isLinkedIn ? (
            <div className="flex flex-wrap items-center gap-2">
              {dirty && <span className="text-xs text-muted">Unsaved edits are saved when you copy.</span>}
              {manualCopy ? (
                <Button variant="send" onClick={confirmManualCopy} disabled={busy !== null}>
                  <Check className="size-4" aria-hidden /> I copied it
                </Button>
              ) : (
                <Button variant="send" onClick={copyForLinkedIn} disabled={busy !== null}>
                  <Copy className="size-4" aria-hidden /> {busy === "copy" ? "Copying…" : "Copy for LinkedIn"}
                </Button>
              )}
              <Button onClick={markSent} disabled={busy !== null || draft.status !== "copied" || dirty}>
                <Check className="size-4" aria-hidden /> Mark as sent manually
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl border border-line p-3">
              <p className="text-sm">
                <span className="text-muted">To:</span> {contact.name}
                {contact.verifiedEmail ? ` <${contact.verifiedEmail}>` : " (no verified email yet)"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={copyText} disabled={busy !== null}>
                  <Copy className="size-4" aria-hidden /> Copy text
                </Button>
                <Button variant="send" disabled title="Gmail sending arrives in Milestone 2">
                  <Send className="size-4" aria-hidden /> Approve &amp; Send
                </Button>
              </div>
              <p className="text-xs text-muted">Gmail sending arrives in Milestone 2. Nothing is sent from this version.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

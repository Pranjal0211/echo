import type { Profile } from "@echo/contracts";
import type { ReactNode } from "react";
import { AddFactForm } from "../components/knowledge/add-fact-form.tsx";
import { FactRow } from "../components/knowledge/fact-row.tsx";
import { card } from "../components/knowledge/form-styles.ts";
import { ProfileDetails } from "../components/knowledge/profile-details.tsx";
import { ResumeImport } from "../components/knowledge/resume-import.tsx";
import { StyleExamples } from "../components/knowledge/style-examples.tsx";
import type { ProfileState } from "../hooks.ts";

/**
 * Knowledge Base (FR-02): what Echo may say about the owner and how they write.
 * Only approved facts reach a draft; "ask every time" facts need an opt-in per draft.
 */
export function KnowledgeBaseScreen({ state }: { state: ProfileState }) {
  const { profile, loading, error, missing, setProfile } = state;

  return (
    <section className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold">Knowledge Base</h1>
        <p className="text-sm text-muted">What Echo may say about you. Drafts only use facts you've approved.</p>
      </header>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : missing || !profile ? (
        <div className="max-w-xl">
          {error && !missing && (
            <p role="alert" className="mb-4 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          {missing && <ProfileDetails profile={null} onSaved={setProfile} />}
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_minmax(300px,380px)]">
          <div className="grid gap-4">
            <ResumeImport onSaved={setProfile} />
            <FactSection
              title="Needs your review"
              description="Suggested from your resume. Echo won't use these until you approve them."
              facts={profile.facts.filter((f) => !f.verified)}
              empty="Nothing waiting. Paste your resume above to get suggestions."
              onSaved={setProfile}
            />
            <FactSection
              title="Approved facts"
              description="Drafts may state these. Facts marked ask every time are left out unless you include them."
              facts={profile.facts.filter((f) => f.verified)}
              empty="No approved facts yet."
              onSaved={setProfile}
            >
              <AddFactForm onSaved={setProfile} />
            </FactSection>
          </div>
          <div className="grid gap-4">
            <ProfileDetails profile={profile} onSaved={setProfile} />
            <StyleExamples profile={profile} onSaved={setProfile} />
          </div>
        </div>
      )}
    </section>
  );
}

function FactSection({
  title,
  description,
  facts,
  empty,
  onSaved,
  children,
}: {
  title: string;
  description: string;
  facts: Profile["facts"];
  empty: string;
  onSaved: (profile: Profile) => void;
  children?: ReactNode;
}) {
  const id = `facts-${title.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <section aria-labelledby={id} className={card}>
      <h2 id={id} className="flex items-center gap-2 font-semibold">
        {title}
        <span className="rounded-full bg-canvas px-2 text-xs font-medium text-muted">{facts.length}</span>
      </h2>
      <p className="text-sm text-muted">{description}</p>
      {facts.length === 0 ? (
        <p className="py-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-1">
          {facts.map((f) => (
            <FactRow key={f.id} fact={f} onSaved={onSaved} />
          ))}
        </ul>
      )}
      {children}
    </section>
  );
}

import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Inbox,
  MessageSquareText,
  Send,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../lib.ts";

export type ScreenId = "inbox" | "outreach" | "jobs" | "contacts" | "knowledge" | "digest" | "settings";

export const SCREENS: ReadonlyArray<{ id: ScreenId; label: string; icon: LucideIcon; milestone?: string }> = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "outreach", label: "Outreach Studio", icon: Send, milestone: "Milestone 1" },
  { id: "jobs", label: "Jobs", icon: Briefcase, milestone: "Milestone 1" },
  { id: "contacts", label: "Contacts", icon: Users, milestone: "Milestone 1" },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen, milestone: "Milestone 1" },
  { id: "digest", label: "Daily Digest", icon: CalendarDays, milestone: "Milestone 5" },
  { id: "settings", label: "Settings", icon: Settings, milestone: "Milestone 2" },
];

export function Sidebar({
  active,
  onSelect,
  waitingCount,
}: {
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
  waitingCount: number;
}) {
  return (
    <aside className="flex shrink-0 flex-col border-line bg-surface md:sticky md:top-0 md:h-screen md:w-60 md:border-r">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">
          <MessageSquareText className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold leading-tight">Echo</p>
          <p className="text-xs text-muted">AI Communication Twin</p>
        </div>
      </div>
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
        {SCREENS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={active === id ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
              active === id ? "bg-brand-soft font-medium text-brand-ink" : "text-muted hover:bg-canvas hover:text-ink",
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span>{label}</span>
            {id === "inbox" && waitingCount > 0 && (
              <span className="ml-auto rounded-full bg-brand px-2 text-xs font-semibold text-white" aria-label={`${waitingCount} waiting on you`}>
                {waitingCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <p className="mt-auto hidden px-5 py-4 text-xs text-muted md:block">
        Synthetic data. Nothing is sent without your approval.
      </p>
    </aside>
  );
}

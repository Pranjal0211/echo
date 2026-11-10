import type { Conversation } from "@echo/contracts";
import { formatWaitingAge, isOverdue, waitingHours } from "@echo/core";
import { Clock } from "lucide-react";
import { Badge } from "./ui/badge.tsx";

/** The lateness signal: how long someone has been waiting on me (ROAST R2). */
export function WaitingBadge({ conversation, now }: { conversation: Conversation; now: Date }) {
  const { waitingOn, waitingSince } = conversation;
  if (waitingOn === "nobody" || !waitingSince) return <Badge>Done</Badge>;
  const age = formatWaitingAge(waitingSince, now);
  if (waitingOn === "them") return <Badge>Waiting on them · {age}</Badge>;
  const tone = isOverdue(conversation, now) ? "danger" : waitingHours(waitingSince, now) >= 24 ? "warn" : "brand";
  return (
    <Badge tone={tone}>
      <Clock className="size-3" aria-hidden /> Waiting on you · {age}
    </Badge>
  );
}

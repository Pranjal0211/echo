import type { Channel } from "@echo/contracts";
import { Mail, MessagesSquare } from "lucide-react";
import { Badge } from "./ui/badge.tsx";

export function ChannelBadge({ channel }: { channel: Channel }) {
  return channel === "gmail" ? (
    <Badge tone="danger">
      <Mail className="size-3" aria-hidden /> Gmail
    </Badge>
  ) : (
    <Badge tone="brand">
      <MessagesSquare className="size-3" aria-hidden /> LinkedIn
    </Badge>
  );
}

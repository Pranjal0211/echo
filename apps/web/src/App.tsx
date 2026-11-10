import { useState } from "react";
import { Sidebar, type ScreenId } from "./components/sidebar.tsx";
import { useInbox, useNow, useProfile } from "./hooks.ts";
import { ComingSoon } from "./screens/coming-soon.tsx";
import { InboxScreen } from "./screens/inbox.tsx";

export function App() {
  const [screen, setScreen] = useState<ScreenId>("inbox");
  const inbox = useInbox();
  const now = useNow();
  const profile = useProfile();
  const waitingCount = inbox.items.filter((i) => i.conversation.waitingOn === "me").length;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar active={screen} onSelect={setScreen} waitingCount={waitingCount} />
      <main className="flex min-w-0 flex-1 flex-col">
        {screen === "inbox" ? (
          <InboxScreen
            items={inbox.items}
            loading={inbox.loading}
            error={inbox.error}
            now={now}
            onChanged={inbox.reload}
            facts={profile.profile?.facts ?? []}
          />
        ) : (
          <ComingSoon screen={screen} />
        )}
      </main>
    </div>
  );
}

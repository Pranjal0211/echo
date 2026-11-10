import { useState } from "react";
import { Sidebar, type ScreenId } from "./components/sidebar.tsx";
import { ComingSoon } from "./screens/coming-soon.tsx";

export function App() {
  const [screen, setScreen] = useState<ScreenId>("inbox");
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar active={screen} onSelect={setScreen} waitingCount={0} />
      <main className="flex min-w-0 flex-1 flex-col">
        {screen === "inbox" ? <p className="p-8 text-muted">Inbox</p> : <ComingSoon screen={screen} />}
      </main>
    </div>
  );
}

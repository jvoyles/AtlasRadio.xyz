import type { ReactNode } from "react";
import { PlayerProvider } from "@/context/PlayerContext";
import { PlayerBar } from "@/components/PlayerBar";
import { TopNav } from "@/components/TopNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <TopNav />
      <main className="relative flex-1 min-h-0 overflow-y-auto">{children}</main>
      <PlayerBar />
    </PlayerProvider>
  );
}

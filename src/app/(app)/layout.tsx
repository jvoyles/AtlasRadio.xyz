import type { ReactNode } from "react";
import { PlayerProvider } from "@/context/PlayerContext";
import { PlayerBar } from "@/components/PlayerBar";
import { TopNav } from "@/components/TopNav";
import { Ufo } from "@/components/Ufo";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <TopNav />
      <Ufo />
      <main className="relative flex-1 min-h-0 overflow-y-auto">{children}</main>
      <PlayerBar />
    </PlayerProvider>
  );
}

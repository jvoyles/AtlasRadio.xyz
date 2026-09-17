import type { ReactNode } from "react";
import { PlayerProvider } from "@/context/PlayerContext";
import { PlayerBar } from "@/components/PlayerBar";
import { FloatingNav } from "@/components/FloatingNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <FloatingNav />
      <main className="relative flex-1 min-h-0 overflow-y-auto">{children}</main>
      <PlayerBar />
    </PlayerProvider>
  );
}

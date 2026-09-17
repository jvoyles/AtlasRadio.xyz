import type { ReactNode } from "react";
import { PlayerProvider } from "@/context/PlayerContext";
import { Sidebar } from "@/components/Sidebar";
import { PlayerBar } from "@/components/PlayerBar";
import { AccentSync } from "@/components/AccentSync";
import { MobileNav } from "@/components/MobileNav";
import { GlobalSearch } from "@/components/GlobalSearch";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <AccentSync />
      <div className="flex flex-1 min-h-0 gap-3 p-3 pb-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto glass-panel rounded-2xl">
          <div className="md:hidden px-4 pt-4">
            <GlobalSearch />
          </div>
          {children}
        </main>
      </div>
      <PlayerBar />
      <MobileNav />
    </PlayerProvider>
  );
}

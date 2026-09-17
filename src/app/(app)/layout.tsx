import type { ReactNode } from "react";
import { PlayerProvider } from "@/context/PlayerContext";
import { Sidebar } from "@/components/Sidebar";
import { PlayerBar } from "@/components/PlayerBar";
import { MobileNav } from "@/components/MobileNav";
import { TopBar } from "@/components/TopBar";
import { GlobalSearch } from "@/components/GlobalSearch";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <TopBar />
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
            <div className="md:hidden px-4 pt-4">
              <GlobalSearch />
            </div>
            {children}
          </main>
        </div>
      </div>
      <PlayerBar />
      <MobileNav />
    </PlayerProvider>
  );
}

import type { ReactNode } from "react";
import { PlayerProvider } from "@/context/PlayerContext";
import { PlayerBar } from "@/components/PlayerBar";
import { TopNav } from "@/components/TopNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <TopNav />
      <main id="main" tabIndex={-1} className="relative flex-1 min-h-0 overflow-y-auto outline-none">
        {children}
      </main>
      <PlayerBar />
    </PlayerProvider>
  );
}

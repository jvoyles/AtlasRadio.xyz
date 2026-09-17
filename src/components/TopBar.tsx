"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { GlobalSearch } from "./GlobalSearch";

export function TopBar() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <header className="hidden md:flex items-center gap-4 px-6 py-3 sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-1 text-muted shrink-0">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-surface-elevated" aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button onClick={() => router.forward()} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-surface-elevated" aria-label="Forward">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex justify-center max-w-2xl mx-auto">
        <GlobalSearch className="w-full max-w-md" />
      </div>

      <div className="shrink-0 w-8 h-8 rounded-full bg-surface flex items-center justify-center text-xs font-bold">
        {user?.email?.[0]?.toUpperCase() ?? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        )}
      </div>
    </header>
  );
}

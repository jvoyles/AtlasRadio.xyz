import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-background">
      <Link href="/" className="flex items-center gap-2 mb-8 text-foreground">
        <svg width="28" height="28" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="var(--color-accent)" />
          <path d="M9.5 8.3v7.4l6.4-3.7z" fill="var(--color-paper)" />
        </svg>
        <span className="text-lg font-semibold font-serif">Airwave</span>
      </Link>
      {children}
    </div>
  );
}

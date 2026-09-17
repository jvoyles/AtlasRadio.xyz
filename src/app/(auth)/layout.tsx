import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-background">
      <Link href="/" className="flex items-center gap-2 mb-8 text-foreground">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--color-accent)">
          <circle cx="12" cy="12" r="11" />
          <path d="M7 15.5c3-1.3 7-1.3 10 0" stroke="#121212" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M6 12c4-2 8-2 12 0" stroke="#121212" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M5.2 8.7c5.2-2.6 9.4-2.6 13.6 0" stroke="#121212" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
        <span className="text-lg font-bold">Airwave</span>
      </Link>
      {children}
    </div>
  );
}

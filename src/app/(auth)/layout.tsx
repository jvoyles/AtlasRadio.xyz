import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <Link href="/" className="mb-8 text-foreground text-sm font-bold uppercase tracking-widest">
        Airwave
      </Link>
      {children}
    </div>
  );
}

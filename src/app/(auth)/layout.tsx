import type { ReactNode } from "react";
import Link from "next/link";
import { SignalIcon } from "@/components/SignalIcon";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <Link href="/" className="flex items-center gap-2 mb-8 text-foreground">
        <SignalIcon className="w-6 h-6 text-accent" />
        <span className="text-lg font-bold">Airwave</span>
      </Link>
      {children}
    </div>
  );
}

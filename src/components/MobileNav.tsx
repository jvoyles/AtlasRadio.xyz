"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const items = [
  { href: "/", section: null, label: "Home" },
  { href: "/?section=trending", section: "trending", label: "Trending" },
  { href: "/?section=countries", section: "countries", label: "Countries" },
  { href: "/favorites", section: null, label: "Liked", path: "/favorites" },
];

export function MobileNav() {
  return (
    <Suspense fallback={null}>
      <MobileNavContent />
    </Suspense>
  );
}

function MobileNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section");
  const activeGenre = searchParams.get("genre");

  return (
    <nav className="md:hidden shrink-0 border-t border-border flex items-stretch justify-between">
      {items.map((item) => {
        const isActive = item.path
          ? pathname === item.path
          : pathname === "/" && !activeGenre && activeSection === item.section;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex-1 text-center py-3 text-[11px] uppercase tracking-wide border-t-2 transition-colors ${
              isActive ? "border-live text-foreground" : "border-transparent text-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

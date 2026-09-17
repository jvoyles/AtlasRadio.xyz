"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
);

const TrendingIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M17 7h4v4" />
  </svg>
);

const GlobeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" />
  </svg>
);

const HeartIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 4.5 5.8 4c2-.3 3.8.7 5 2.4.9-1.7 2.9-2.7 4.9-2.4 3.8.5 5.3 4.4 3.8 7.8-2.5 4.6-10 9.2-10 9.2z" />
  </svg>
);

const items = [
  { href: "/", section: null, label: "Home", icon: HomeIcon },
  { href: "/?section=trending", section: "trending", label: "Trending", icon: TrendingIcon },
  { href: "/?section=countries", section: "countries", label: "Countries", icon: GlobeIcon },
  { href: "/favorites", section: null, label: "Liked", icon: HeartIcon, path: "/favorites" },
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
    <nav className="md:hidden shrink-0 bg-background border-t border-border flex items-stretch justify-between px-2 py-1">
      {items.map((item) => {
        const isActive = item.path
          ? pathname === item.path
          : pathname === "/" && !activeGenre && activeSection === item.section;
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors ${
              isActive ? "text-foreground" : "text-muted"
            }`}
          >
            <Icon active={isActive} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

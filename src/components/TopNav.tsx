"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { GlobalSearch } from "./GlobalSearch";
import { ListIcon as PhMenu, XIcon as PhClose } from "@phosphor-icons/react";

const navItems = [
  { href: "/", section: null, label: "Globe" },
  { href: "/?section=trending", section: "trending", label: "Trending" },
];

function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="var(--accent)" />
      <circle cx="16" cy="16" r="2.6" fill="#fff" />
      <path d="M10.8 10.8a7.4 7.4 0 0 0 0 10.4M21.2 10.8a7.4 7.4 0 0 1 0 10.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.4 7.4a12.2 12.2 0 0 0 0 17.2M24.6 7.4a12.2 12.2 0 0 1 0 17.2" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TopNav() {
  return (
    <Suspense fallback={<header className="h-14 shrink-0 border-b border-border" />}>
      <TopNavContent />
    </Suspense>
  );
}

function TopNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section");
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (section: string | null) =>
    pathname === "/" && !searchParams.get("q") && section === (activeSection ?? null);

  const linkClass = (active: boolean) =>
    `relative h-14 px-3.5 flex items-center text-sm font-medium transition-colors ${
      active ? "text-foreground" : "text-muted hover:text-foreground"
    }`;
  const underline = (active: boolean) =>
    active ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" /> : null;

  return (
    <header className="relative z-30 h-14 shrink-0 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="h-full w-full px-4 sm:px-6 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2.5 mr-4 shrink-0">
          <LogoMark />
          <span className="text-[17px] font-bold tracking-tight text-foreground">Airwave</span>
        </Link>

        <nav className="hidden md:flex items-stretch h-14">
          {navItems.map((item) => {
            const active = isActive(item.section);
            return (
              <Link key={item.label} href={item.href} className={linkClass(active)}>
                {item.label}
                {underline(active)}
              </Link>
            );
          })}
          <Link href="/favorites" className={linkClass(pathname === "/favorites")}>
            Liked
            {underline(pathname === "/favorites")}
          </Link>
        </nav>

        <div className="flex-1" />

        <GlobalSearch
          className="hidden sm:block w-64 lg:w-80"
        />

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-foreground hover:bg-surface-elevated"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <PhClose size={22} weight="bold" /> : <PhMenu size={22} weight="bold" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden absolute top-full inset-x-0 border-b border-border bg-background px-4 py-3 shadow-2xl flex flex-col gap-1">
          <GlobalSearch className="sm:hidden mb-2" />
          {[...navItems, { href: "/favorites", section: "fav", label: "Liked" }].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-surface-elevated"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

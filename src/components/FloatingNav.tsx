"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { GlobalSearch } from "./GlobalSearch";

const navItems = [
  { href: "/", section: null, label: "Home" },
  { href: "/?section=trending", section: "trending", label: "Trending" },
  { href: "/?section=countries", section: "countries", label: "Countries" },
  { href: "/?section=genres", section: "genres", label: "Genres" },
];

export function FloatingNav() {
  return (
    <Suspense fallback={null}>
      <FloatingNavContent />
    </Suspense>
  );
}

function FloatingNavContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const activeSection = searchParams.get("section");
  const activeGenre = searchParams.get("genre");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="fixed top-4 left-4 right-4 z-30 flex items-center gap-3">
      <Link href="/" className="glass aurora-ring rounded-full px-4 py-2.5 flex items-center gap-2 shrink-0">
        <span className="w-2 h-2 rounded-full bg-accent pulse-glow shrink-0" />
        <span className="text-sm font-bold aurora-text whitespace-nowrap">Airwave</span>
      </Link>

      <nav className="hidden md:flex glass rounded-full px-1.5 py-1.5 items-center gap-1 shrink-0">
        {navItems.map((item) => {
          const isActive =
            pathname === "/" && !activeGenre && (item.section ?? null) === (activeSection ?? null);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive ? "bg-accent text-background" : "text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/favorites"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            pathname === "/favorites" ? "bg-accent text-background" : "text-muted hover:text-foreground"
          }`}
        >
          Liked
        </Link>
      </nav>

      <div className="flex-1 min-w-0 max-w-xs">
        <GlobalSearch className="glass rounded-full" inputClassName="bg-transparent" />
      </div>

      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="md:hidden glass rounded-full w-10 h-10 flex items-center justify-center shrink-0"
        aria-label="Toggle menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="hidden md:block shrink-0">
        {loading ? null : user ? (
          <button
            onClick={handleSignOut}
            className="glass rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold"
            title="Log out"
          >
            {user.email?.[0]?.toUpperCase()}
          </button>
        ) : (
          <Link
            href="/login"
            className="glass rounded-full px-4 py-2.5 text-sm font-bold text-accent hover:text-accent-hover whitespace-nowrap"
          >
            Log in
          </Link>
        )}
      </div>

      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 glass rounded-2xl p-3 flex flex-col gap-1 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-surface"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/favorites"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-surface"
          >
            Liked
          </Link>
          {!loading && !user && (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-bold text-accent"
            >
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

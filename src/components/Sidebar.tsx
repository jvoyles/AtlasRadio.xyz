"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useGenres } from "@/hooks/useGenres";
import { GlobalSearch } from "./GlobalSearch";

const navItems = [
  { section: null, label: "Home" },
  { section: "trending", label: "Trending" },
  { section: "countries", label: "Countries" },
];

function ContentsLink({
  active,
  href,
  onClick,
  label,
  trailing,
}: {
  active: boolean;
  href?: string;
  onClick?: () => void;
  label: string;
  trailing?: React.ReactNode;
}) {
  const classes = `flex items-center gap-2 w-full px-4 py-1.5 text-[13px] uppercase tracking-wide border-l-2 transition-colors ${
    active ? "border-live text-foreground" : "border-transparent text-muted hover:text-foreground"
  }`;
  const content = (
    <>
      <span className="truncate">{label}</span>
      {trailing}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<aside className="hidden md:flex w-60 border-r border-border shrink-0 h-full" />}>
      <SidebarContent />
    </Suspense>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const activeGenre = searchParams.get("genre");
  const activeSection = searchParams.get("section");
  const [genresOpen, setGenresOpen] = useState(Boolean(activeGenre));
  const { genres } = useGenres();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initial = user?.email?.[0]?.toUpperCase();

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-border shrink-0 h-full">
      <div className="px-4 py-4 flex items-center gap-2.5 border-b border-border">
        <span className="text-sm font-bold text-foreground tracking-widest uppercase flex-1">
          Airwave
        </span>
        {initial && (
          <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-live border border-live shrink-0">
            {initial}
          </span>
        )}
      </div>

      <div className="px-4 py-3 border-b border-border">
        <GlobalSearch />
      </div>

      <div className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-muted">
        Bulletin Contents
      </div>

      <nav className="flex flex-col">
        {navItems.map((item) => {
          const isActive = pathname === "/" && !activeGenre && activeSection === item.section;
          return (
            <ContentsLink
              key={item.label}
              active={isActive}
              href={item.section ? `/?section=${item.section}` : "/"}
              label={item.label}
            />
          );
        })}

        <ContentsLink active={pathname === "/favorites"} href="/favorites" label="Liked" />
      </nav>

      <div className="flex-1 overflow-y-auto min-h-0">
        <ContentsLink
          active={Boolean(activeGenre)}
          onClick={() => setGenresOpen((v) => !v)}
          label="Genres"
          trailing={<span className="ml-auto text-[10px]">{genresOpen ? "−" : "+"}</span>}
        />

        {genresOpen && (
          <div className="flex flex-col pl-8 pr-3 max-h-64 overflow-y-auto">
            {genres.map((g) => (
              <Link
                key={g.tag}
                href={`/?genre=${encodeURIComponent(g.tag)}`}
                className={`py-1 text-[12px] truncate transition-colors ${
                  activeGenre === g.tag ? "text-live" : "text-muted hover:text-foreground"
                }`}
              >
                {g.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border">
        {loading ? null : user ? (
          <button
            onClick={handleSignOut}
            className="text-[13px] uppercase tracking-wide text-muted hover:text-foreground text-left w-full"
          >
            Log out
          </button>
        ) : (
          <Link
            href="/login"
            className="block text-center py-2 text-[13px] font-bold uppercase tracking-wide border border-live text-live hover:bg-live hover:text-background transition-colors"
          >
            Log in
          </Link>
        )}
      </div>
    </aside>
  );
}

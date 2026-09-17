"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useGenres } from "@/hooks/useGenres";

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

const GenreIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={`ml-auto shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

function NavItem({
  active,
  href,
  onClick,
  icon,
  label,
  trailing,
}: {
  active: boolean;
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
}) {
  const classes = `flex items-center gap-4 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    active ? "bg-surface text-foreground font-bold" : "text-muted hover:text-foreground hover:bg-surface"
  }`;
  const content = (
    <>
      <span className={active ? "text-accent" : ""}>{icon}</span>
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

  const isHome = pathname === "/" && !activeGenre && activeSection === null;

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-border shrink-0 h-full">
      <Link href="/" className="px-5 py-4 flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="var(--color-accent)" />
          <path d="M9.5 8.3v7.4l6.4-3.7z" fill="#0f0f0f" />
        </svg>
        <span className="text-lg font-bold text-foreground">Airwave</span>
      </Link>

      <nav className="flex flex-col gap-0.5 px-3 mt-2">
        <NavItem active={isHome} href="/" icon={<HomeIcon active={isHome} />} label="Home" />
        <NavItem
          active={pathname === "/" && activeSection === "trending"}
          href="/?section=trending"
          icon={<TrendingIcon active={pathname === "/" && activeSection === "trending"} />}
          label="Trending"
        />
        <NavItem
          active={pathname === "/" && activeSection === "countries"}
          href="/?section=countries"
          icon={<GlobeIcon active={pathname === "/" && activeSection === "countries"} />}
          label="Countries"
        />
        <NavItem
          active={pathname === "/favorites"}
          href="/favorites"
          icon={<HeartIcon active={pathname === "/favorites"} />}
          label="Liked Songs"
        />
      </nav>

      <div className="mx-3 my-3 border-t border-border" />

      <div className="flex-1 overflow-y-auto min-h-0 px-3">
        <NavItem
          active={Boolean(activeGenre)}
          onClick={() => setGenresOpen((v) => !v)}
          icon={<GenreIcon active={Boolean(activeGenre)} />}
          label="Genres"
          trailing={<ChevronIcon open={genresOpen} />}
        />

        {genresOpen && (
          <div className="flex flex-col gap-0.5 mt-1 pl-10 pr-2 max-h-64 overflow-y-auto">
            {genres.map((g) => (
              <Link
                key={g.tag}
                href={`/?genre=${encodeURIComponent(g.tag)}`}
                className={`py-1.5 text-sm truncate transition-colors ${
                  activeGenre === g.tag ? "text-accent font-bold" : "text-muted hover:text-foreground"
                }`}
              >
                {g.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-4">
        {loading ? null : user ? (
          <button
            onClick={handleSignOut}
            className="px-3 py-2 text-sm font-bold text-muted hover:text-foreground text-left w-full"
          >
            Log out
          </button>
        ) : (
          <Link
            href="/login"
            className="block text-center py-2.5 rounded-full border border-muted text-sm font-bold hover:border-foreground hover:bg-surface transition-colors"
          >
            Log in
          </Link>
        )}
      </div>
    </aside>
  );
}

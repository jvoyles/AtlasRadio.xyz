"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { useGenres } from "@/hooks/useGenres";
import { SignalIcon } from "./SignalIcon";
import { GlobalSearch } from "./GlobalSearch";

const HomeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
);

const TrendingIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M17 7h4v4" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" />
  </svg>
);

const HeartIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 4.5 5.8 4c2-.3 3.8.7 5 2.4.9-1.7 2.9-2.7 4.9-2.4 3.8.5 5.3 4.4 3.8 7.8-2.5 4.6-10 9.2-10 9.2z" />
  </svg>
);

const LogOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);

const LogInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M15 21h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-4" />
    <path d="M10 17l5-5-5-5M15 12H3" />
  </svg>
);

const GenreIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={`ml-auto shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const navItems = [
  { section: null, label: "Home", icon: HomeIcon },
  { section: "trending", label: "Trending", icon: TrendingIcon },
  { section: "countries", label: "Countries", icon: GlobeIcon },
];

function NavPill({
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
  const classes = `flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    active
      ? "bg-accent/20 text-foreground"
      : "text-muted hover:text-foreground hover:bg-white/5"
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
    <Suspense fallback={<aside className="hidden md:flex w-64 glass-panel shrink-0 h-full rounded-2xl" />}>
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
    <aside className="hidden md:flex w-64 flex-col glass-panel shrink-0 h-full rounded-2xl">
      <div className="px-4 py-4 flex items-center gap-2.5">
        <span className="text-accent shrink-0">
          <SignalIcon className="w-5 h-5" />
        </span>
        <span className="text-base font-bold text-foreground flex-1">Airwave</span>
        {initial && (
          <span className="w-7 h-7 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0">
            {initial}
          </span>
        )}
      </div>

      <div className="px-3 pb-2">
        <GlobalSearch />
      </div>

      <nav className="flex flex-col gap-1 px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === "/" && !activeGenre && activeSection === item.section;
          return (
            <NavPill
              key={item.label}
              active={isActive}
              href={item.section ? `/?section=${item.section}` : "/"}
              icon={<Icon />}
              label={item.label}
            />
          );
        })}

        <NavPill
          active={pathname === "/favorites"}
          href="/favorites"
          icon={<HeartIcon />}
          label="Liked"
        />
      </nav>

      <div className="flex-1 overflow-y-auto min-h-0 px-3">
        <NavPill
          active={Boolean(activeGenre)}
          onClick={() => setGenresOpen((v) => !v)}
          icon={<GenreIcon />}
          label="Genres"
          trailing={<ChevronIcon open={genresOpen} />}
        />

        {genresOpen && (
          <div className="flex flex-col gap-0.5 mt-1 pl-11 pr-2 max-h-64 overflow-y-auto">
            {genres.map((g) => (
              <Link
                key={g.tag}
                href={`/?genre=${encodeURIComponent(g.tag)}`}
                className={`px-2 py-1.5 text-[13px] rounded-lg truncate transition-colors ${
                  activeGenre === g.tag
                    ? "text-accent font-medium"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {g.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-3">
        {loading ? null : user ? (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-white/5 text-left w-full transition-colors"
          >
            <LogOutIcon />
            Log out
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold bg-accent text-background hover:bg-accent-hover transition-colors"
          >
            <LogInIcon />
            Log in
          </Link>
        )}
      </div>
    </aside>
  );
}

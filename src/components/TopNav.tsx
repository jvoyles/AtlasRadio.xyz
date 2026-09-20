"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { GlobalSearch } from "./GlobalSearch";
import { LogoMark } from "./LogoMark";
import { usePlayer } from "@/context/PlayerContext";
import { ListIcon as PhMenu, XIcon as PhClose } from "@phosphor-icons/react";

function Logo({ live }: { live: boolean }) {
  return (
    <span className="relative flex items-center justify-center w-9 h-9">
      {live && <span className="absolute inset-1 rounded-full bg-[#ff6a2b]/40 animate-ping" />}
      <span className="relative">
        <LogoMark size={28} />
      </span>
    </span>
  );
}

export function TopNav() {
  return (
    <Suspense fallback={null}>
      <TopNavContent />
    </Suspense>
  );
}

// Three floating glass islands over the globe, all 48px tall. A soft
// highlight slides to the active section, and the logo orb pings while a
// station is playing.
function TopNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isPlaying } = usePlayer();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const section = searchParams.get("section");
  const hasQuery = Boolean(searchParams.get("q"));
  const items = [
    { href: "/", label: "Globe", active: pathname === "/" && !hasQuery && section === null },
    { href: "/?section=trending", label: "Trending", active: pathname === "/" && !hasQuery && section === "trending" },
    { href: "/favorites", label: "Liked", active: pathname === "/favorites" },
  ];
  const activeIndex = items.findIndex((i) => i.active);

  useEffect(() => {
    const place = () => {
      const nav = navRef.current;
      const indicator = indicatorRef.current;
      if (!nav || !indicator) return;
      const link = nav.querySelectorAll<HTMLElement>("[data-dial-link]")[activeIndex];
      if (!link) {
        indicator.style.opacity = "0";
        return;
      }
      indicator.style.opacity = "1";
      indicator.style.width = `${link.offsetWidth}px`;
      indicator.style.transform = `translateX(${link.offsetLeft}px)`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [activeIndex]);

  return (
    <header className="fixed top-3 inset-x-3 sm:inset-x-5 z-30 pointer-events-none">
      <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-start gap-3">
        <Link
          href="/"
          className="pointer-events-auto glass-island justify-self-start flex items-center gap-2.5 h-12 pl-2 pr-4 rounded-full"
        >
          <Logo live={isPlaying} />
          <span className="text-[17px] font-bold tracking-tight text-foreground">AtlasRadio.xyz</span>
        </Link>

        <nav
          ref={navRef}
          aria-label="Primary"
          className="pointer-events-auto glass-island relative hidden md:flex items-center h-12 p-1 rounded-full"
        >
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className="absolute left-0 top-1 bottom-1 rounded-full bg-white/[0.08] transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ opacity: 0 }}
          />
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              data-dial-link
              className={`relative z-10 h-10 px-5 flex items-center text-sm font-medium transition-colors ${
                item.active ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
              aria-current={item.active ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="justify-self-end flex items-start gap-2">
          <GlobalSearch className="pointer-events-auto hidden sm:block w-64 lg:w-80" />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="pointer-events-auto glass-island md:hidden w-12 h-12 rounded-full flex items-center justify-center text-foreground"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <PhClose size={22} weight="bold" /> : <PhMenu size={22} weight="bold" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="pointer-events-auto md:hidden mt-2 glass-island !bg-[rgba(10,14,23,0.92)] rounded-3xl p-3 flex flex-col gap-1">
          <GlobalSearch className="sm:hidden mb-2" />
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              aria-current={item.active ? "page" : undefined}
              className={`px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                item.active ? "bg-white/[0.08] text-foreground" : "text-muted hover:text-foreground hover:bg-white/[0.05]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

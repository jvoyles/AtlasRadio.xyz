"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowElbowDownLeftIcon as PhEnter,
  MagnifyingGlassIcon as PhSearch,
  MusicNotesIcon as PhNote,
  SpinnerGapIcon as PhSpinner,
  XIcon as PhClose,
} from "@phosphor-icons/react";
import { registerClick, searchStations, type Station } from "@/lib/radioBrowser";
import { usePlayer } from "@/context/PlayerContext";

const SUGGESTIONS = ["Jazz", "Lo-fi", "BBC", "News", "Classical", "Salsa"];

export function GlobalSearch({ className = "" }: { className?: string }) {
  return (
    <Suspense fallback={null}>
      <GlobalSearchContent className={className} />
    </Suspense>
  );
}

function GlobalSearchContent({ className }: { className: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { play } = usePlayer();
  const activeQuery = searchParams.get("q") ?? "";

  const [value, setValue] = useState(activeQuery);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the field in sync when the URL's ?q= changes from elsewhere (e.g.
  // the Back button on the results view) — adjusted during render rather
  // than in an effect to avoid a cascading extra render.
  const [trackedQuery, setTrackedQuery] = useState(activeQuery);
  if (activeQuery !== trackedQuery) {
    setTrackedQuery(activeQuery);
    setValue(activeQuery);
  }

  const trimmed = value.trim();

  useEffect(() => {
    if (!open || trimmed.length < 2) return;
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchStations({ name: trimmed, limit: 6 });
        if (!cancelled) {
          setResults(data);
          setHighlight(-1);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [trimmed, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.matches?.("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const close = () => {
    setOpen(false);
    inputRef.current?.blur();
  };

  const submit = (query: string) => {
    const q = query.trim();
    if (!q) return;
    router.push(`/?q=${encodeURIComponent(q)}`);
    close();
  };

  const choose = (station: Station) => {
    registerClick(station.stationuuid).catch(() => {});
    play(station);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (value) setValue("");
      else close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && results[highlight]) choose(results[highlight]);
      else submit(value);
    }
  };

  const showPanel = open;
  const hasQuery = trimmed.length >= 2;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        className={`group flex items-center gap-2.5 h-12 pl-4 pr-3 rounded-full border backdrop-blur-xl transition-all duration-200 ${
          open
            ? "bg-white/[0.09] border-accent/70 shadow-[0_0_0_4px_rgba(47,111,235,0.18),0_8px_30px_-8px_rgba(47,111,235,0.5)]"
            : "bg-white/[0.05] border-white/10 hover:bg-white/[0.08] hover:border-white/20"
        }`}
      >
        <PhSearch size={18} weight="bold" className={`shrink-0 transition-colors ${open ? "text-accent" : "text-ink-muted"}`} />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="search-results"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search stations…"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          style={{ outline: "none" }}
          className="flex-1 min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
        {loading ? (
          <PhSpinner size={16} weight="bold" className="shrink-0 animate-spin text-ink-muted" />
        ) : value ? (
          <button
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white/10"
            aria-label="Clear search"
          >
            <PhClose size={12} weight="bold" />
          </button>
        ) : (
          <kbd className="hidden lg:flex shrink-0 h-6 min-w-6 px-1.5 rounded-md border border-white/10 bg-white/[0.06] text-[11px] text-ink-muted items-center justify-center font-sans">
            /
          </kbd>
        )}
      </div>

      {showPanel && (
        <div
          id="search-results"
          role="listbox"
          className="absolute right-0 top-full mt-2 w-[min(26rem,calc(100vw-2rem))] max-md:w-full rounded-2xl border border-white/10 bg-[rgba(10,14,23,0.985)] backdrop-blur-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] overflow-hidden z-40"
        >
          {!hasQuery ? (
            <div className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-3">Try searching for</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setValue(s);
                      inputRef.current?.focus();
                    }}
                    className="px-3 py-1.5 rounded-full text-[13px] bg-white/[0.07] text-ink hover:bg-accent hover:text-white transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="p-1.5">
                {results.length === 0 && !loading && (
                  <p className="px-3 py-6 text-center text-sm text-ink-muted">No stations match “{trimmed}”.</p>
                )}
                {results.length === 0 && loading && (
                  <div className="flex flex-col gap-1 p-1.5" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3 h-11 animate-pulse">
                        <div className="w-9 h-9 rounded-lg bg-white/[0.07]" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 w-2/3 rounded bg-white/[0.07]" />
                          <div className="h-2 w-1/3 rounded bg-white/[0.05]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {results.map((station, i) => (
                  <button
                    key={station.stationuuid}
                    role="option"
                    aria-selected={i === highlight}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => choose(station)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${
                      i === highlight ? "bg-white/[0.09]" : ""
                    }`}
                  >
                    <span className="w-9 h-9 rounded-lg overflow-hidden bg-white/[0.07] shrink-0 flex items-center justify-center">
                      {station.favicon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={station.favicon}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                        />
                      ) : (
                        <PhNote size={16} weight="bold" className="text-ink-muted" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink truncate">{station.name.trim()}</span>
                      <span className="block text-[12px] text-ink-muted truncate">
                        {station.country || "Worldwide"}
                        {station.tags ? ` · ${station.tags.split(",")[0]}` : ""}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => submit(value)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 border-t border-white/10 text-[13px] text-ink-muted hover:text-ink hover:bg-white/[0.05] transition-colors"
              >
                <span className="truncate">
                  See all results for <span className="text-ink font-medium">“{trimmed}”</span>
                </span>
                <PhEnter size={15} weight="bold" className="shrink-0" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

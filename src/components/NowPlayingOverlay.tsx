"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import { registerClick } from "@/lib/radioBrowser";
import { ShareButton } from "./ShareButton";
import { EqualizerBars } from "./EqualizerBars";
import { formatElapsed } from "@/lib/format";
import { CaretDownIcon as PhCollapse, HeartIcon as PhHeart, MusicNotesIcon as PhNote, PauseIcon as PhPause, PlayIcon as PhPlay, RepeatIcon as PhRepeat, ShuffleIcon as PhShuffle, SkipBackIcon as PhBack, SkipForwardIcon as PhForward } from "@phosphor-icons/react";

const PlayIcon = () => <PhPlay size={26} weight="fill" />;
const PauseIcon = () => <PhPause size={26} weight="fill" />;
const RewindIcon = () => <PhBack size={26} weight="fill" />;
const ForwardIcon = () => <PhForward size={26} weight="fill" />;
const ShuffleIcon = () => <PhShuffle size={22} weight="bold" />;
const RepeatIcon = () => <PhRepeat size={22} weight="bold" />;
const HeartIcon = ({ filled }: { filled: boolean }) => <PhHeart size={24} weight={filled ? "fill" : "bold"} />;
const CollapseIcon = () => <PhCollapse size={20} weight="bold" />;
const MiniPlayIcon = () => <PhPlay size={14} weight="fill" />;


export function NowPlayingOverlay({ onClose }: { onClose: () => void }) {
  const {
    current,
    isPlaying,
    isLoading,
    elapsed,
    canGoPrevious,
    canGoNext,
    autoRetry,
    recentlyPlayed,
    play,
    toggle,
    previous,
    next,
    shuffle,
    toggleAutoRetry,
  } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 150);
  };

  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const handleCloseRef = useRef(handleClose);
  useEffect(() => {
    handleCloseRef.current = handleClose;
  });

  // Modal behaviour: focus moves in, Tab stays inside, Esc closes, and focus
  // returns to whatever opened it.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !rootRef.current) return;
      const focusable = Array.from(
        rootRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, []);

  if (!current) return null;
  const favorited = isFavorite(current.stationuuid);
  const live = isPlaying && !isLoading;
  const upNext = recentlyPlayed.filter((s) => s.stationuuid !== current.stationuuid).slice(0, 8);

  const handleFavorite = () => toggleFavorite(current);

  const playFromQueue = (station: (typeof upNext)[number]) => {
    registerClick(station.stationuuid).catch(() => {});
    play(station);
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Now playing: ${current.name}`}
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* YouTube Music-style backdrop: the station's own art, blown up and
          blurred, standing in for a color wash without ever sampling pixels. */}
      <div className="absolute inset-0 bg-background">
        {current.favicon && (
          <img
            src={current.favicon}
            alt=""
 referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-125 blur-3xl opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/70" />
      </div>

      <button
        ref={closeRef}
        onClick={handleClose}
        className="absolute top-[max(1.25rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-20 paper-card rounded-full w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink"
        aria-label="Close now playing"
      >
        <CollapseIcon />
      </button>
      <div className="absolute top-[max(1.25rem,env(safe-area-inset-top))] right-5 z-20 paper-card rounded-full w-9 h-9 flex items-center justify-center">
        <ShareButton station={current} idleClassName="text-ink-muted hover:text-ink" placement="bottom" />
      </div>

      <div className="relative z-10 h-full overflow-y-auto overscroll-contain">
      <div className="min-h-full flex items-center justify-center px-6 sm:px-8 pt-20 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div
          className={`flex flex-col lg:flex-row items-center lg:items-start gap-8 sm:gap-12 max-w-4xl w-full transition-transform duration-200 ${
            visible ? "scale-100" : "scale-95"
          }`}
        >
          <div className="flex flex-col items-center gap-6 sm:gap-8 max-w-sm w-full shrink-0">
            <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-lg overflow-hidden bg-surface-elevated shadow-2xl flex items-center justify-center">
              {current.favicon ? (
                <img
                  src={current.favicon}
                  alt=""
 referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                />
              ) : (
                <PhNote size={56} weight="bold" className="text-muted" />
              )}
            </div>

            <div className="w-full min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold font-serif truncate">{current.name}</h1>
                  <p className="text-sm text-muted truncate">
                    {current.country || "Worldwide"} · {current.tags?.split(",")[0] || "radio"}
                  </p>
                </div>
                <button
                  onClick={handleFavorite}
                  className={`shrink-0 ${favorited ? "text-accent-fg" : "text-muted hover:text-foreground"}`}
                  aria-label={`Like ${current.name}`}
                  aria-pressed={favorited}
                >
                  <HeartIcon filled={favorited} />
                </button>
              </div>
            </div>

            <div className="w-full">
              <div className="flex items-center gap-2 text-[11px] text-muted mb-4 tabular-nums">
                <span>{formatElapsed(elapsed)}</span>
                <div className="flex-1 h-1 rounded-full bg-surface-elevated overflow-hidden">
                  <div className={`h-full rounded-full bg-foreground ${live ? "w-full" : "w-0"}`} />
                </div>
                <span className={live ? "text-accent-fg font-semibold flex items-center gap-1.5" : ""}>
                  {live && <EqualizerBars />}
                  {live ? "LIVE" : "—"}
                </span>
              </div>

              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={shuffle}
                  className="text-muted hover:text-foreground transition-colors"
                  aria-label="Shuffle to another station"
                >
                  <ShuffleIcon />
                </button>
                <button
                  onClick={previous}
                  disabled={!canGoPrevious}
                  className="text-foreground disabled:opacity-30 hover:scale-105 transition-transform"
                  aria-label="Previous station"
                >
                  <RewindIcon />
                </button>
                <button
                  onClick={toggle}
                  className="w-14 h-14 rounded-full bg-accent text-paper flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isLoading ? (
                    <span className="w-5 h-5 rounded-full border-2 border-paper border-t-transparent animate-spin" />
                  ) : isPlaying ? (
                    <PauseIcon />
                  ) : (
                    <PlayIcon />
                  )}
                </button>
                <button
                  onClick={next}
                  disabled={!canGoNext}
                  className="text-foreground disabled:opacity-30 hover:scale-105 transition-transform"
                  aria-label="Next station"
                >
                  <ForwardIcon />
                </button>
                <button
                  onClick={toggleAutoRetry}
                  className={`transition-colors ${autoRetry ? "text-accent-fg" : "text-muted hover:text-foreground"}`}
                  aria-label="Auto-reconnect if the stream drops"
                  aria-pressed={autoRetry}
                  title="Auto-reconnect if the stream drops"
                >
                  <RepeatIcon />
                </button>
              </div>
            </div>
          </div>

          {upNext.length > 0 && (
            <div className="w-full max-w-sm lg:pt-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted mb-3">Up Next</h2>
              <div className="flex flex-col gap-1 paper-card rounded-lg p-2">
                {upNext.map((station) => (
                  <button
                    key={station.stationuuid}
                    onClick={() => playFromQueue(station)}
                    className="group flex items-center gap-3 px-2 py-2 rounded-md hover:bg-paper-elevated text-left transition-colors"
                  >
                    <span className="relative w-10 h-10 rounded-md overflow-hidden bg-paper-elevated shrink-0 flex items-center justify-center">
                      {station.favicon ? (
                        <img
                          src={station.favicon}
                          alt=""
 referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                        />
                      ) : (
                        <PhNote size={18} weight="bold" className="text-ink-muted" />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-ink/40 text-paper opacity-0 group-hover:opacity-100 transition-opacity">
                        <MiniPlayIcon />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">{station.name}</p>
                      <p className="text-[12px] text-ink-muted truncate">{station.country || "Worldwide"}</p>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

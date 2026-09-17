"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useRouter } from "next/navigation";
import { registerClick } from "@/lib/radioBrowser";
import { ShareButton } from "./ShareButton";
import { EqualizerBars } from "./EqualizerBars";
import { formatElapsed } from "@/lib/format";

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
  </svg>
);

const RewindIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 12l8-6v12l-8-6z" />
    <path d="M3 12l8-6v12l-8-6z" />
  </svg>
);

const ForwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 12l-8-6v12l8-6z" />
    <path d="M21 12l-8-6v12l8-6z" />
  </svg>
);

const ShuffleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h4l10 12h4M3 18h4l4-4.5M17 6h4v4M17 18h4v-4M13 8.5L17 6M13 15.5L17 18" />
  </svg>
);

const RepeatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 4.5 5.8 4c2-.3 3.8.7 5 2.4.9-1.7 2.9-2.7 4.9-2.4 3.8.5 5.3 4.4 3.8 7.8-2.5 4.6-10 9.2-10 9.2z" />
  </svg>
);

const CollapseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const MiniPlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

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
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 150);
  };

  if (!current) return null;
  const favorited = isFavorite(current.stationuuid);
  const live = isPlaying && !isLoading;
  const upNext = recentlyPlayed.filter((s) => s.stationuuid !== current.stationuuid).slice(0, 8);

  const handleFavorite = async () => {
    const { needsAuth } = await toggleFavorite(current);
    if (needsAuth) router.push("/login");
  };

  const playFromQueue = (station: (typeof upNext)[number]) => {
    registerClick(station.stationuuid).catch(() => {});
    play(station);
  };

  return (
    <div
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
            className="w-full h-full object-cover scale-125 blur-3xl opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/70" />
      </div>

      <button
        onClick={handleClose}
        className="absolute top-6 left-1/2 -translate-x-1/2 z-10 glass rounded-full w-9 h-9 flex items-center justify-center text-muted hover:text-foreground"
        aria-label="Close now playing"
      >
        <CollapseIcon />
      </button>
      <div className="absolute top-6 right-6 z-10 glass rounded-full w-9 h-9 flex items-center justify-center">
        <ShareButton station={current} />
      </div>

      <div className="relative z-10 h-full overflow-y-auto flex items-center justify-center px-8 py-16">
        <div
          className={`flex flex-col lg:flex-row items-center lg:items-start gap-12 max-w-4xl w-full transition-transform duration-200 ${
            visible ? "scale-100" : "scale-95"
          }`}
        >
          <div className="flex flex-col items-center gap-8 max-w-sm w-full shrink-0">
            <div className="w-64 h-64 rounded-lg overflow-hidden bg-surface-elevated shadow-2xl flex items-center justify-center">
              {current.favicon ? (
                <img src={current.favicon} alt="" className="w-full h-full object-cover" />
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                  <circle cx="12" cy="14" r="4" />
                  <path d="M4 14a8 8 0 0 1 16 0" />
                </svg>
              )}
            </div>

            <div className="w-full min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold truncate">{current.name}</h1>
                  <p className="text-sm text-muted truncate">
                    {current.country || "Worldwide"} · {current.tags?.split(",")[0] || "radio"}
                  </p>
                </div>
                <button
                  onClick={handleFavorite}
                  className={`shrink-0 ${favorited ? "text-accent2" : "text-muted hover:text-foreground"}`}
                  aria-label="Toggle favorite"
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
                <span className={live ? "text-accent font-semibold flex items-center gap-1.5" : ""}>
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
                  className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isLoading ? (
                    <span className="w-5 h-5 rounded-full border-2 border-background border-t-transparent animate-spin" />
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
                  className={`transition-colors ${autoRetry ? "text-accent" : "text-muted hover:text-foreground"}`}
                  aria-label="Toggle auto-reconnect"
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
              <div className="flex flex-col gap-1 bg-background/40 rounded-lg backdrop-blur-sm">
                {upNext.map((station) => (
                  <button
                    key={station.stationuuid}
                    onClick={() => playFromQueue(station)}
                    className="group flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/10 text-left transition-colors"
                  >
                    <span className="relative w-10 h-10 rounded-md overflow-hidden bg-surface-elevated shrink-0 flex items-center justify-center">
                      {station.favicon ? (
                        <img src={station.favicon} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                          <circle cx="12" cy="14" r="4" />
                          <path d="M4 14a8 8 0 0 1 16 0" />
                        </svg>
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MiniPlayIcon />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{station.name}</p>
                      <p className="text-[12px] text-muted truncate">{station.country || "Worldwide"}</p>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

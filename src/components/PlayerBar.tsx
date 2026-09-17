"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import { NowPlayingOverlay } from "./NowPlayingOverlay";
import { ShareButton } from "./ShareButton";
import { formatElapsed } from "@/lib/format";

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
  </svg>
);

const RewindIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 12l8-6v12l-8-6z" />
    <path d="M3 12l8-6v12l-8-6z" />
  </svg>
);

const ForwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 12l-8-6v12l8-6z" />
    <path d="M21 12l-8-6v12l8-6z" />
  </svg>
);

const ShuffleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h4l10 12h4M3 18h4l4-4.5M17 6h4v4M17 18h4v-4M13 8.5L17 6M13 15.5L17 18" />
  </svg>
);

const RepeatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 4.5 5.8 4c2-.3 3.8.7 5 2.4.9-1.7 2.9-2.7 4.9-2.4 3.8.5 5.3 4.4 3.8 7.8-2.5 4.6-10 9.2-10 9.2z" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);

export function PlayerBar() {
  const {
    current,
    isPlaying,
    isLoading,
    volume,
    elapsed,
    canGoPrevious,
    canGoNext,
    autoRetry,
    toggle,
    setVolume,
    previous,
    next,
    shuffle,
    toggleAutoRetry,
  } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const favorited = current ? isFavorite(current.stationuuid) : false;
  const live = isPlaying && !isLoading;

  const handleFavorite = async () => {
    if (!current) return;
    const { needsAuth } = await toggleFavorite(current);
    if (needsAuth) router.push("/login");
  };

  return (
    <>
      {expanded && <NowPlayingOverlay onClose={() => setExpanded(false)} />}

      <footer className="shrink-0 bg-background border-t border-border px-4 py-3 grid grid-cols-3 items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {current ? (
            <>
              <button
                onClick={() => setExpanded(true)}
                className="w-14 h-14 rounded-md overflow-hidden bg-surface-elevated shrink-0 flex items-center justify-center"
                aria-label="Expand now playing"
              >
                {current.favicon ? (
                  <img
                    src={current.favicon}
                    onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                    <circle cx="12" cy="14" r="4" />
                    <path d="M4 14a8 8 0 0 1 16 0" />
                  </svg>
                )}
              </button>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{current.name}</p>
                <p className="text-[12px] text-muted truncate">{current.country || current.tags}</p>
              </div>
              <button
                onClick={handleFavorite}
                className={`shrink-0 ${favorited ? "text-accent" : "text-muted hover:text-foreground"}`}
                aria-label="Toggle favorite"
              >
                <HeartIcon filled={favorited} />
              </button>
            </>
          ) : (
            <p className="text-sm text-muted">Pick a station to start listening</p>
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-5">
            <button
              onClick={shuffle}
              disabled={!current}
              className="text-muted hover:text-foreground disabled:opacity-30 transition-colors"
              aria-label="Shuffle to another station"
            >
              <ShuffleIcon />
            </button>
            <button
              onClick={previous}
              disabled={!canGoPrevious}
              className="text-foreground hover:scale-105 disabled:opacity-30 transition-transform"
              aria-label="Previous station"
            >
              <RewindIcon />
            </button>
            <button
              onClick={toggle}
              disabled={!current}
              className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-background border-t-transparent animate-spin" />
              ) : isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </button>
            <button
              onClick={next}
              disabled={!canGoNext}
              className="text-foreground hover:scale-105 disabled:opacity-30 transition-transform"
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
          {current && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted tabular-nums w-full max-w-md">
              <span>{formatElapsed(elapsed)}</span>
              <div className="flex-1 h-1 rounded-full bg-surface-elevated overflow-hidden">
                <div className={`h-full rounded-full bg-foreground ${live ? "w-full" : "w-0"} transition-[width]`} />
              </div>
              <span className={live ? "text-accent font-semibold" : ""}>{live ? "LIVE" : "—"}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 justify-end">
          {current && <ShareButton station={current} />}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-muted shrink-0 hidden sm:block">
            <path d="M3 10v4h4l5 5V5L7 10H3z" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="volume-slider w-24 hidden sm:block"
            style={{ "--value": `${volume * 100}%` } as CSSProperties}
          />
          <button
            onClick={() => setExpanded(true)}
            disabled={!current}
            className="text-muted hover:text-foreground disabled:opacity-30"
            aria-label="Expand now playing"
          >
            <ExpandIcon />
          </button>
        </div>
      </footer>
    </>
  );
}

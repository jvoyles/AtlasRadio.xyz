"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import { NowPlayingOverlay } from "./NowPlayingOverlay";
import { ShareButton } from "./ShareButton";
import { PipFlash } from "./PipFlash";
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
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 12l8-6v12l-8-6z" />
    <path d="M3 12l8-6v12l-8-6z" />
  </svg>
);

const ForwardIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 12l-8-6v12l8-6z" />
    <path d="M21 12l-8-6v12l8-6z" />
  </svg>
);

const ShuffleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M3 6h4l10 12h4M3 18h4l4-4.5M17 6h4v4M17 18h4v-4M13 8.5L17 6M13 15.5L17 18" />
  </svg>
);

const RepeatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.75"
  >
    <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 4.5 5.8 4c2-.3 3.8.7 5 2.4.9-1.7 2.9-2.7 4.9-2.4 3.8.5 5.3 4.4 3.8 7.8-2.5 4.6-10 9.2-10 9.2z" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
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

      <footer className="shrink-0 border-t border-border px-5 py-2.5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4 sm:grid sm:grid-cols-3 sm:gap-6">
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-none">
            {current ? (
              <>
                <button
                  onClick={() => setExpanded(true)}
                  className="text-[13px] min-w-0 text-left"
                  aria-label="Expand now playing"
                >
                  <p className="truncate">{current.name}</p>
                  <p className="text-[11px] text-muted truncate">{current.country || current.tags}</p>
                </button>
                <button
                  onClick={handleFavorite}
                  className={`shrink-0 ${favorited ? "text-live" : "text-muted hover:text-foreground"}`}
                  aria-label="Toggle favorite"
                >
                  <HeartIcon filled={favorited} />
                </button>
              </>
            ) : (
              <p className="text-[13px] text-muted">Pick a station to start listening</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={shuffle}
              disabled={!current}
              className="hidden sm:block text-muted hover:text-foreground disabled:opacity-30 transition-colors"
              aria-label="Shuffle to another station"
            >
              <ShuffleIcon />
            </button>
            <button
              onClick={previous}
              disabled={!canGoPrevious}
              className="text-foreground hover:text-live disabled:opacity-30 transition-colors"
              aria-label="Previous station"
            >
              <RewindIcon />
            </button>
            <button
              onClick={toggle}
              disabled={!current}
              className="w-8 h-8 border border-foreground flex items-center justify-center disabled:opacity-30 hover:border-live hover:text-live transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <span className="w-3 h-3 border-2 border-foreground border-t-transparent animate-spin" />
              ) : isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </button>
            <button
              onClick={next}
              disabled={!canGoNext}
              className="text-foreground hover:text-live disabled:opacity-30 transition-colors"
              aria-label="Next station"
            >
              <ForwardIcon />
            </button>
            <button
              onClick={toggleAutoRetry}
              className={`hidden sm:block transition-colors ${autoRetry ? "text-live" : "text-muted hover:text-foreground"}`}
              aria-label="Toggle auto-reconnect"
              title="Auto-reconnect if the stream drops"
            >
              <RepeatIcon />
            </button>
          </div>

          <div className="flex items-center gap-4 justify-end shrink-0">
            <div className="hidden sm:flex items-center gap-3">
              {current && <ShareButton station={current} />}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="volume-slider w-20"
                style={{ "--value": `${volume * 100}%` } as CSSProperties}
              />
            </div>
            <button
              onClick={() => setExpanded(true)}
              disabled={!current}
              className="text-muted hover:text-foreground disabled:opacity-30"
              aria-label="Expand now playing"
            >
              <ExpandIcon />
            </button>
          </div>
        </div>

        {current && (
          <div className="flex items-center gap-2 text-[11px] text-muted tabular-nums">
            <span>{formatElapsed(elapsed)}</span>
            <div className="flex-1 h-px bg-border" />
            <span className={`font-semibold flex items-center gap-2 uppercase tracking-wide ${live ? "text-live" : ""}`}>
              {live && <PipFlash playKey={current.stationuuid} />}
              {live ? "On Air" : "Paused"}
            </span>
          </div>
        )}
      </footer>
    </>
  );
}

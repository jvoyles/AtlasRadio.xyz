"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import { EqualizerBars } from "./EqualizerBars";
import { NowPlayingOverlay } from "./NowPlayingOverlay";
import { ShareButton } from "./ShareButton";
import { SignalIcon } from "./SignalIcon";
import { formatElapsed } from "@/lib/format";

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
  </svg>
);

const RewindIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 12l8-6v12l-8-6z" />
    <path d="M3 12l8-6v12l-8-6z" />
  </svg>
);

const ForwardIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 12l-8-6v12l8-6z" />
    <path d="M21 12l-8-6v12l8-6z" />
  </svg>
);

const ShuffleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M3 6h4l10 12h4M3 18h4l4-4.5M17 6h4v4M17 18h4v-4M13 8.5L17 6M13 15.5L17 18" />
  </svg>
);

const RepeatIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.75"
  >
    <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 4.5 5.8 4c2-.3 3.8.7 5 2.4.9-1.7 2.9-2.7 4.9-2.4 3.8.5 5.3 4.4 3.8 7.8-2.5 4.6-10 9.2-10 9.2z" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);

const MicIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
    <path d="M19 11a7 7 0 0 1-14 0M12 19v3" />
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

      <footer className="shrink-0 m-3 mt-3 px-6 py-3 flex flex-col gap-2.5 glass-panel rounded-2xl">
        <div className="flex items-center justify-between gap-4 sm:grid sm:grid-cols-3 sm:gap-6">
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-none">
            {current ? (
              <>
                <button
                  onClick={() => setExpanded(true)}
                  className="relative w-12 h-12 rounded-full overflow-hidden bg-surface-elevated border border-border shrink-0 flex items-center justify-center"
                  aria-label="Expand now playing"
                >
                  <span className={live ? "disc-spin w-full h-full block" : "w-full h-full block"}>
                    {current.favicon ? (
                      <img
                        src={current.favicon}
                        onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center">
                        <SignalIcon className="w-5 h-5 text-muted" />
                      </span>
                    )}
                  </span>
                </button>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium truncate">{current.name}</p>
                  <p className="text-[11px] text-muted truncate">{current.country || current.tags}</p>
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
              <p className="text-[13px] text-muted">Pick a station to start listening</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={shuffle}
              disabled={!current}
              className="hidden sm:block text-muted hover:text-accent disabled:opacity-30 transition-colors"
              aria-label="Shuffle to another station"
            >
              <ShuffleIcon />
            </button>
            <button
              onClick={previous}
              disabled={!canGoPrevious}
              className="text-foreground hover:text-accent disabled:opacity-30 transition-colors"
              aria-label="Previous station"
            >
              <RewindIcon />
            </button>
            <button
              onClick={toggle}
              disabled={!current}
              className="w-11 h-11 rounded-full bg-accent text-background flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-90 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <span className="w-4 h-4 rounded-full border-2 border-background border-t-transparent animate-spin" />
              ) : isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </button>
            <button
              onClick={next}
              disabled={!canGoNext}
              className="text-foreground hover:text-accent disabled:opacity-30 transition-colors"
              aria-label="Next station"
            >
              <ForwardIcon />
            </button>
            <button
              onClick={toggleAutoRetry}
              className={`hidden sm:block transition-colors ${autoRetry ? "text-accent" : "text-muted hover:text-foreground"}`}
              aria-label="Toggle auto-reconnect"
              title="Auto-reconnect if the stream drops"
            >
              <RepeatIcon />
            </button>
          </div>

          <div className="flex items-center gap-4 justify-end shrink-0">
            <div className="hidden sm:flex items-center gap-4">
              <button
                onClick={() => router.push("/?focus=search")}
                className="text-muted hover:text-accent transition-colors"
                aria-label="Search stations"
                title="Search stations"
              >
                <MicIcon />
              </button>
              {current && <ShareButton station={current} />}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-muted shrink-0">
                <path d="M3 10v4h4l5 5V5L7 10H3z" />
              </svg>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="volume-slider w-24"
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
            <div className="flex-1 h-[3px] rounded-full bg-border overflow-hidden">
              <div className={`h-full rounded-full bg-accent ${live ? "w-full" : "w-0"} transition-[width]`} />
            </div>
            <span className={`font-semibold flex items-center gap-1.5 ${live ? "text-accent" : ""}`}>
              {live && <EqualizerBars />}
              Live
            </span>
          </div>
        )}
      </footer>
    </>
  );
}

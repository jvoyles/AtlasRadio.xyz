"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useRouter } from "next/navigation";
import { ShareButton } from "./ShareButton";
import { PipFlash } from "./PipFlash";
import { formatElapsed } from "@/lib/format";

const PlayIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
  </svg>
);

const RewindIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 12l8-6v12l-8-6z" />
    <path d="M3 12l8-6v12l-8-6z" />
  </svg>
);

const ForwardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 12l-8-6v12l8-6z" />
    <path d="M21 12l-8-6v12l8-6z" />
  </svg>
);

const ShuffleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M3 6h4l10 12h4M3 18h4l4-4.5M17 6h4v4M17 18h4v-4M13 8.5L17 6M13 15.5L17 18" />
  </svg>
);

const RepeatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
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
    strokeWidth="1.75"
  >
    <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 4.5 5.8 4c2-.3 3.8.7 5 2.4.9-1.7 2.9-2.7 4.9-2.4 3.8.5 5.3 4.4 3.8 7.8-2.5 4.6-10 9.2-10 9.2z" />
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

  const handleFavorite = async () => {
    const { needsAuth } = await toggleFavorite(current);
    if (needsAuth) router.push("/login");
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-8 bg-background transition-opacity duration-150 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute top-6 right-6 z-10 flex items-center gap-4">
        <ShareButton station={current} />
        <button
          onClick={handleClose}
          className="text-[13px] uppercase tracking-wide text-muted hover:text-foreground"
          aria-label="Close now playing"
        >
          Close
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full">
        <div className="w-40 h-40 overflow-hidden bg-surface-elevated border border-border flex items-center justify-center">
          {current.favicon ? (
            <img src={current.favicon} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-muted text-xs uppercase">No Signal</span>
          )}
        </div>

        <div className="text-center w-full min-w-0">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted flex items-center justify-center gap-2 mb-2">
            {live && <PipFlash playKey={current.stationuuid} />}
            {live ? "On The Record" : "Paused"}
          </span>
          <h1 className="text-xl font-bold truncate">{current.name}</h1>
          <p className="text-sm text-muted truncate">
            {current.country || "Worldwide"} · {current.tags?.split(",")[0] || "radio"}
          </p>
        </div>

        <div className="w-full">
          <div className="flex items-center gap-2 text-[11px] text-muted mb-4 tabular-nums">
            <span>{formatElapsed(elapsed)}</span>
            <div className="flex-1 h-px bg-border" />
            <span className={live ? "text-live font-semibold" : ""}>{live ? "LIVE" : "—"}</span>
          </div>

          <div className="flex items-center justify-center gap-5">
            <button
              onClick={handleFavorite}
              className={favorited ? "text-live" : "text-muted hover:text-foreground"}
              aria-label="Toggle favorite"
            >
              <HeartIcon filled={favorited} />
            </button>
            <button
              onClick={shuffle}
              className="text-muted hover:text-foreground"
              aria-label="Shuffle to another station"
            >
              <ShuffleIcon />
            </button>
            <button
              onClick={previous}
              disabled={!canGoPrevious}
              className="text-foreground disabled:opacity-30"
              aria-label="Previous station"
            >
              <RewindIcon />
            </button>
            <button
              onClick={toggle}
              className="w-12 h-12 border border-foreground flex items-center justify-center hover:border-live hover:text-live transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-foreground border-t-transparent animate-spin" />
              ) : isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </button>
            <button
              onClick={next}
              disabled={!canGoNext}
              className="text-foreground disabled:opacity-30"
              aria-label="Next station"
            >
              <ForwardIcon />
            </button>
            <button
              onClick={toggleAutoRetry}
              className={autoRetry ? "text-live" : "text-muted hover:text-foreground"}
              aria-label="Toggle auto-reconnect"
              title="Auto-reconnect if the stream drops"
            >
              <RepeatIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

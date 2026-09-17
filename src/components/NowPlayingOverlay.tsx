"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useRouter } from "next/navigation";
import { EqualizerBars } from "./EqualizerBars";
import { ShareButton } from "./ShareButton";
import { SignalIcon } from "./SignalIcon";
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
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M3 6h4l10 12h4M3 18h4l4-4.5M17 6h4v4M17 18h4v-4M13 8.5L17 6M13 15.5L17 18" />
  </svg>
);

const RepeatIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.75"
  >
    <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 4.5 5.8 4c2-.3 3.8.7 5 2.4.9-1.7 2.9-2.7 4.9-2.4 3.8.5 5.3 4.4 3.8 7.8-2.5 4.6-10 9.2-10 9.2z" />
  </svg>
);

const CollapseIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M18 6L6 18M6 6l12 12" />
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
    setTimeout(onClose, 200);
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center px-8 transition-opacity duration-200 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-2xl" />

      <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
        <ShareButton station={current} />
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-muted hover:text-foreground active:scale-90 transition-transform"
          aria-label="Close now playing"
        >
          <CollapseIcon />
        </button>
      </div>

      <div
        className={`relative z-10 flex flex-col items-center gap-8 max-w-sm w-full transition-transform duration-200 ease-out ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        <div
          className={`relative w-56 h-56 rounded-full overflow-hidden bg-surface-elevated border border-border flex items-center justify-center shadow-2xl ${
            live ? "disc-spin" : ""
          }`}
        >
          {current.favicon ? (
            <img src={current.favicon} alt="" className="w-full h-full object-cover" />
          ) : (
            <SignalIcon className="w-16 h-16 text-muted" />
          )}
          <span className="absolute w-6 h-6 rounded-full bg-background border border-border" />
        </div>

        <div className="text-center w-full min-w-0">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span
              className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                live ? "bg-accent/20 text-accent" : "bg-surface-elevated text-muted"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-accent animate-pulse" : "bg-muted"}`} />
              {live ? "On air" : "Paused"}
            </span>
            {live && <EqualizerBars />}
          </div>
          <h1 className="text-2xl font-bold truncate">{current.name}</h1>
          <p className="text-sm text-muted truncate">
            {current.country || "Worldwide"} · {current.tags?.split(",")[0] || "radio"}
          </p>
        </div>

        <div className="w-full">
          <div className="flex items-center gap-2 text-[11px] text-muted mb-4 tabular-nums">
            <span>{formatElapsed(elapsed)}</span>
            <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
              <div className={`h-full bg-accent ${live ? "w-full animate-pulse" : "w-0"}`} />
            </div>
            <span className="text-accent font-semibold">LIVE</span>
          </div>

          <div className="flex items-center justify-center gap-5">
            <button
              onClick={handleFavorite}
              className={`active:scale-90 transition-transform ${favorited ? "text-accent" : "text-muted hover:text-foreground"}`}
              aria-label="Toggle favorite"
            >
              <HeartIcon filled={favorited} />
            </button>
            <button
              onClick={shuffle}
              className="text-muted hover:text-foreground active:scale-90 transition-transform"
              aria-label="Shuffle to another station"
            >
              <ShuffleIcon />
            </button>
            <button
              onClick={previous}
              disabled={!canGoPrevious}
              className="text-foreground disabled:opacity-30 hover:scale-110 active:scale-90 transition-transform"
              aria-label="Previous station"
            >
              <RewindIcon />
            </button>
            <button
              onClick={toggle}
              className="w-14 h-14 rounded-full bg-accent text-background flex items-center justify-center hover:scale-105 active:scale-90 transition-transform shadow-lg shadow-accent/30"
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
              className="text-foreground disabled:opacity-30 hover:scale-110 active:scale-90 transition-transform"
              aria-label="Next station"
            >
              <ForwardIcon />
            </button>
            <button
              onClick={toggleAutoRetry}
              className={`active:scale-90 transition-transform ${autoRetry ? "text-accent" : "text-muted hover:text-foreground"}`}
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

"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useRouter } from "next/navigation";
import { registerClick, type Station } from "@/lib/radioBrowser";
import { EqualizerBars } from "./EqualizerBars";
import { SignalIcon } from "./SignalIcon";

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

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.75"
  >
    <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 4.5 5.8 4c2-.3 3.8.7 5 2.4.9-1.7 2.9-2.7 4.9-2.4 3.8.5 5.3 4.4 3.8 7.8-2.5 4.6-10 9.2-10 9.2z" />
  </svg>
);

export function NowPlayingCanvas({ featured }: { featured: Station | null }) {
  const { current, isPlaying, isLoading, toggle, play } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();

  const station = current ?? featured;
  if (!station) return null;

  const live = Boolean(current) && isPlaying && !isLoading;
  const favorited = isFavorite(station.stationuuid);

  const handlePrimary = () => {
    if (current) {
      toggle();
    } else {
      registerClick(station.stationuuid).catch(() => {});
      play(station);
    }
  };

  const handleFavorite = async () => {
    const { needsAuth } = await toggleFavorite(station);
    if (needsAuth) router.push("/login");
  };

  return (
    <div className="relative rounded-3xl glass-panel p-6 sm:p-8 overflow-hidden">
      <div className="relative z-10 flex items-center gap-6">
        <div
          className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-surface-elevated border border-border shrink-0 flex items-center justify-center shadow-xl ${
            live ? "disc-spin" : ""
          }`}
        >
          {station.favicon ? (
            <img src={station.favicon} alt="" className="w-full h-full object-cover" />
          ) : (
            <SignalIcon className="w-10 h-10 text-muted" />
          )}
          <span className="absolute w-4 h-4 rounded-full bg-background border border-border" />
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            {current ? "Now Playing" : "Featured Signal"}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold truncate mt-1">{station.name}</h1>
          <p className="text-sm text-muted truncate mt-0.5">
            {station.country || "Worldwide"} · {station.tags?.split(",")[0] || "radio"}
          </p>
          {live && (
            <div className="flex items-center gap-1.5 mt-2 text-accent text-[12px] font-medium">
              <EqualizerBars />
              Live
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleFavorite}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              favorited ? "text-accent" : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
            aria-label="Toggle favorite"
          >
            <HeartIcon filled={favorited} />
          </button>
          <button
            onClick={handlePrimary}
            className="w-14 h-14 rounded-full bg-accent text-background flex items-center justify-center hover:scale-105 active:scale-90 transition-transform shadow-lg shadow-accent/30"
            aria-label={live ? "Pause" : "Play"}
          >
            {isLoading && current ? (
              <span className="w-5 h-5 rounded-full border-2 border-background border-t-transparent animate-spin" />
            ) : live ? (
              <PauseIcon />
            ) : (
              <PlayIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

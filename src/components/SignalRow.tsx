"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import type { Station } from "@/lib/radioBrowser";
import { registerClick } from "@/lib/radioBrowser";
import { EqualizerBars } from "./EqualizerBars";

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
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

export function SignalRow({ index, station }: { index?: number; station: Station }) {
  const { current, isPlaying, play } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();

  const isActive = current?.stationuuid === station.stationuuid;
  const live = isActive && isPlaying;
  const favorited = isFavorite(station.stationuuid);

  const handlePlay = () => {
    registerClick(station.stationuuid).catch(() => {});
    play(station);
  };

  const handleFavorite = () => toggleFavorite(station);

  return (
    <div className="group flex items-center gap-4 px-3 py-2 rounded-md hover:bg-surface-elevated transition-colors">
      {typeof index === "number" && (
        <span className="w-5 shrink-0 flex items-center justify-center">
          <span className={`text-sm text-muted tabular-nums ${live ? "hidden" : "group-hover:hidden"}`}>
            {index + 1}
          </span>
          <span className={live ? "group-hover:hidden" : "hidden"}>
            <EqualizerBars />
          </span>
          <button
            onClick={handlePlay}
            className={`text-foreground ${live ? "hidden" : "hidden group-hover:block"}`}
            aria-label="Play"
          >
            <PlayIcon />
          </button>
          <button
            onClick={handlePlay}
            className={`text-foreground ${live ? "hidden group-hover:block" : "hidden"}`}
            aria-label="Pause"
          >
            <PauseIcon />
          </button>
        </span>
      )}

      <button onClick={handlePlay} className="relative w-10 h-10 rounded-md overflow-hidden bg-surface-elevated shrink-0 flex items-center justify-center">
        {station.favicon ? (
          <img
            src={station.favicon}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
            <circle cx="12" cy="14" r="4" />
            <path d="M4 14a8 8 0 0 1 16 0" />
          </svg>
        )}
      </button>

      <button onClick={handlePlay} className="min-w-0 flex-1 text-left">
        <p className={`text-sm font-medium truncate ${live ? "text-accent" : "text-foreground"}`}>{station.name}</p>
        <p className="text-[13px] text-muted truncate">
          {station.country || "Unknown"} · {station.tags?.split(",")[0] || "radio"}
        </p>
      </button>

      <button
        onClick={handleFavorite}
        className={`shrink-0 transition-opacity ${
          favorited ? "text-accent opacity-100" : "text-muted hover:text-foreground opacity-0 group-hover:opacity-100"
        }`}
        aria-label="Toggle favorite"
      >
        <HeartIcon filled={favorited} />
      </button>
    </div>
  );
}

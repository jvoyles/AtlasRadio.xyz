"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import type { Station } from "@/lib/radioBrowser";
import { registerClick } from "@/lib/radioBrowser";
import { useRouter } from "next/navigation";
import { PipFlash } from "./PipFlash";

const PlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.75"
  >
    <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 4.5 5.8 4c2-.3 3.8.7 5 2.4.9-1.7 2.9-2.7 4.9-2.4 3.8.5 5.3 4.4 3.8 7.8-2.5 4.6-10 9.2-10 9.2z" />
  </svg>
);

export function SignalRow({ index, station }: { index?: number; station: Station }) {
  const { current, isPlaying, play } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();

  const isActive = current?.stationuuid === station.stationuuid;
  const live = isActive && isPlaying;
  const favorited = isFavorite(station.stationuuid);

  const handlePlay = () => {
    registerClick(station.stationuuid).catch(() => {});
    play(station);
  };

  const handleFavorite = async () => {
    const { needsAuth } = await toggleFavorite(station);
    if (needsAuth) router.push("/login");
  };

  return (
    <div className="group flex items-center gap-3 py-2 border-b border-border">
      {typeof index === "number" && (
        <span className="text-[12px] text-muted w-6 shrink-0 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}

      <button
        onClick={handlePlay}
        className="w-6 h-6 border border-border flex items-center justify-center shrink-0 hover:border-live hover:text-live transition-colors"
        aria-label={live ? "Pause" : "Play"}
      >
        {live ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button onClick={handlePlay} className="min-w-0 flex-1 text-left flex items-baseline gap-2">
        <span className={`text-sm truncate ${live ? "text-live" : "text-foreground"}`}>{station.name}</span>
        <span className="text-[12px] text-muted truncate shrink-0">
          [{station.country || "Unknown"} — {station.tags?.split(",")[0] || "radio"}]
        </span>
      </button>

      {live && (
        <span className="hidden sm:block shrink-0">
          <PipFlash playKey={station.stationuuid} />
        </span>
      )}

      <button
        onClick={handleFavorite}
        className={`shrink-0 transition-opacity ${
          favorited ? "text-live opacity-100" : "text-muted hover:text-foreground opacity-0 group-hover:opacity-100"
        }`}
        aria-label="Toggle favorite"
      >
        <HeartIcon filled={favorited} />
      </button>
    </div>
  );
}

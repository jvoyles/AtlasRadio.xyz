"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import type { Station } from "@/lib/radioBrowser";
import { registerClick } from "@/lib/radioBrowser";
import { useRouter } from "next/navigation";
import { EqualizerBars } from "./EqualizerBars";
import { SignalIcon } from "./SignalIcon";

const PlayIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
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
    <div
      className={`group flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors ${
        live ? "bg-accent/10" : "hover:bg-white/5"
      }`}
    >
      {typeof index === "number" && (
        <span className="text-[12px] text-muted w-5 shrink-0 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}

      <button
        onClick={handlePlay}
        className="relative w-11 h-11 rounded-full overflow-hidden border border-border shrink-0 flex items-center justify-center bg-surface-elevated"
        aria-label={live ? "Pause" : "Play"}
      >
        {station.favicon ? (
          <img
            src={station.favicon}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <SignalIcon className="w-4 h-4 text-muted" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity">
          {live ? <PauseIcon /> : <PlayIcon />}
        </span>
      </button>

      <button onClick={handlePlay} className="min-w-0 flex-1 text-left">
        <p
          className={`text-sm font-semibold truncate ${live ? "text-accent" : "group-hover:text-accent"} transition-colors`}
        >
          {station.name}
        </p>
        <p className="text-[12px] text-muted truncate">
          {station.country || "Unknown"} · {station.tags?.split(",")[0] || "radio"}
        </p>
      </button>

      {live && (
        <span className="hidden sm:flex items-center gap-1.5 shrink-0 text-[11px] font-medium text-accent">
          <EqualizerBars />
          Live
        </span>
      )}

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

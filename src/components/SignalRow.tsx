"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import type { Station } from "@/lib/radioBrowser";
import { registerClick } from "@/lib/radioBrowser";
import { EqualizerBars } from "./EqualizerBars";
import { HeartIcon as PhHeart, MusicNotesIcon as PhNote, PauseIcon as PhPause, PlayIcon as PhPlay } from "@phosphor-icons/react";

const PlayIcon = () => <PhPlay size={16} weight="fill" />;
const PauseIcon = () => <PhPause size={16} weight="fill" />;
const HeartIcon = ({ filled }: { filled: boolean }) => <PhHeart size={20} weight={filled ? "fill" : "bold"} />;
const StationPlaceholder = () => <PhNote size={18} weight="bold" className="text-muted" />;


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
    <div className="group flex items-center gap-4 px-6 sm:px-8 py-2.5 hover:bg-white/[0.06] transition-colors">
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
          <StationPlaceholder />
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
        className={`shrink-0 p-1.5 -mr-1.5 transition-opacity ${
          favorited ? "text-accent opacity-100" : "text-muted hover:text-foreground opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        }`}
        aria-label="Toggle favorite"
      >
        <HeartIcon filled={favorited} />
      </button>
    </div>
  );
}

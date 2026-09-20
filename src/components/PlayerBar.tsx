"use client";

import { useState, type CSSProperties } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import dynamic from "next/dynamic";
import { ShareButton } from "./ShareButton";
import { formatElapsed } from "@/lib/format";
import { ArrowsOutSimpleIcon as PhExpand, HeartIcon as PhHeart, MusicNotesIcon as PhNote, PauseIcon as PhPause, PlayIcon as PhPlay, RepeatIcon as PhRepeat, ShuffleIcon as PhShuffle, SkipBackIcon as PhBack, SkipForwardIcon as PhForward, SpeakerHighIcon as PhVolumeHigh, SpeakerLowIcon as PhVolumeLow, SpeakerXIcon as PhVolumeOff } from "@phosphor-icons/react";

const NowPlayingOverlay = dynamic(() => import("./NowPlayingOverlay").then((m) => m.NowPlayingOverlay), { ssr: false });

const PlayIcon = () => <PhPlay size={18} weight="fill" />;
const PauseIcon = () => <PhPause size={18} weight="fill" />;
const RewindIcon = () => <PhBack size={20} weight="fill" />;
const ForwardIcon = () => <PhForward size={20} weight="fill" />;
const ShuffleIcon = () => <PhShuffle size={18} weight="bold" />;
const RepeatIcon = () => <PhRepeat size={18} weight="bold" />;
const HeartIcon = ({ filled }: { filled: boolean }) => <PhHeart size={17} weight={filled ? "fill" : "bold"} />;
const ExpandIcon = () => <PhExpand size={18} weight="bold" />;


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
  const [expanded, setExpanded] = useState(false);
  const [volumeBeforeMute, setVolumeBeforeMute] = useState(0.8);

  const VolumeIcon = volume === 0 ? PhVolumeOff : volume < 0.5 ? PhVolumeLow : PhVolumeHigh;
  const toggleMute = () => {
    if (volume === 0) {
      setVolume(volumeBeforeMute);
    } else {
      setVolumeBeforeMute(volume);
      setVolume(0);
    }
  };

  const favorited = current ? isFavorite(current.stationuuid) : false;
  const live = isPlaying && !isLoading;

  const handleFavorite = () => {
    if (current) toggleFavorite(current);
  };

  if (!current) return null;

  return (
    <>
      {expanded && <NowPlayingOverlay onClose={() => setExpanded(false)} />}

      <footer className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-3 sm:inset-x-5 z-30 glass-island rounded-[2rem] sm:rounded-full px-3 sm:px-6 py-2.5 sm:py-3 grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-3 items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setExpanded(true)}
            className="relative w-11 h-11 rounded-full overflow-hidden bg-paper-elevated shrink-0 flex items-center justify-center"
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
              <PhNote size={20} weight="bold" className="text-ink-muted" />
            )}
            {live && <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-accent pulse-glow" />}
          </button>
          <div className="min-w-0 flex-1 sm:flex-none">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setExpanded(true)}
                className="min-w-0 text-left text-sm font-medium font-serif truncate"
                aria-label="Expand now playing"
              >
                {current.name}
              </button>
              <button
                onClick={handleFavorite}
                className={`shrink-0 ${favorited ? "text-accent" : "text-ink-muted hover:text-ink"}`}
                aria-label="Toggle favorite"
              >
                <HeartIcon filled={favorited} />
              </button>
            </div>
            <button
              onClick={() => setExpanded(true)}
              className="block max-w-full text-left text-[12px] text-ink-muted truncate"
              tabIndex={-1}
            >
              {current.country || current.tags}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={shuffle}
              className="hidden sm:block text-ink-muted hover:text-ink transition-colors"
              aria-label="Shuffle to another station"
            >
              <ShuffleIcon />
            </button>
            <button
              onClick={previous}
              disabled={!canGoPrevious}
              className="text-ink hover:scale-105 disabled:opacity-30 transition-transform"
              aria-label="Previous station"
            >
              <RewindIcon />
            </button>
            <button
              onClick={toggle}
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-full bg-accent text-paper flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-paper border-t-transparent animate-spin" />
              ) : isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </button>
            <button
              onClick={next}
              disabled={!canGoNext}
              className="text-ink hover:scale-105 disabled:opacity-30 transition-transform"
              aria-label="Next station"
            >
              <ForwardIcon />
            </button>
            <button
              onClick={toggleAutoRetry}
              className={`hidden sm:block transition-colors ${autoRetry ? "text-accent" : "text-ink-muted hover:text-ink"}`}
              aria-label="Toggle auto-reconnect"
              title="Auto-reconnect if the stream drops"
            >
              <RepeatIcon />
            </button>
          </div>
          {current && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-ink-muted tabular-nums w-full max-w-md">
              <span>{formatElapsed(elapsed)}</span>
              <div className="flex-1 h-1 rounded-full bg-paper-elevated overflow-hidden">
                <div className={`h-full rounded-full bg-accent ${live ? "w-full" : "w-0"} transition-[width]`} />
              </div>
              <span className={live ? "text-accent font-semibold" : ""}>{live ? "LIVE" : "—"}</span>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-3 justify-end">
          <ShareButton station={current} idleClassName="text-ink-muted hover:text-ink" />
          <button
            onClick={toggleMute}
            className="shrink-0 text-ink-muted hover:text-ink transition-colors"
            aria-label={volume === 0 ? "Unmute" : "Mute"}
          >
            <VolumeIcon size={18} weight="bold" />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="volume-slider w-28"
            style={{ "--value": `${volume * 100}%` } as CSSProperties}
          />
          <button
            onClick={() => setExpanded(true)}
            className="text-ink-muted hover:text-ink"
            aria-label="Expand now playing"
          >
            <ExpandIcon />
          </button>
        </div>
      </footer>
    </>
  );
}

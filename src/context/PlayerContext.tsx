"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Station } from "@/lib/radioBrowser";
import { isPublicHttpUrl, sanitizeStations } from "@/lib/sanitize";

const RECENT_KEY = "airwave:recently-played";
const RECENT_MAX = 12;

function readRecent(): Station[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? sanitizeStations(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

type PlayerState = {
  current: Station | null;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  recentlyPlayed: Station[];
  elapsed: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  autoRetry: boolean;
  play: (station: Station) => void;
  toggle: () => void;
  setVolume: (v: number) => void;
  previous: () => void;
  next: () => void;
  shuffle: () => void;
  toggleAutoRetry: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Station[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [autoRetry, setAutoRetry] = useState(false);
  const autoRetryRef = useRef(autoRetry);
  const currentRef = useRef(current);

  useEffect(() => {
    autoRetryRef.current = autoRetry;
    currentRef.current = current;
  }, [autoRetry, current]);

  // localStorage isn't available during SSR, so this list is hydrated
  // client-side only, after mount — reading it in the initializer instead
  // would make the server and client markup disagree.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentlyPlayed(readRecent());
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.volume = volume;
      audio.addEventListener("playing", () => {
        setIsPlaying(true);
        setIsLoading(false);
      });
      audio.addEventListener("waiting", () => setIsLoading(true));
      audio.addEventListener("pause", () => setIsPlaying(false));
      audio.addEventListener("error", () => {
        setIsLoading(false);
        setIsPlaying(false);
        if (autoRetryRef.current && currentRef.current) {
          setTimeout(() => {
            if (!audioRef.current || !currentRef.current) return;
            audioRef.current.src = currentRef.current.url_resolved;
            audioRef.current.play().catch(() => {});
          }, 2000);
        }
      });
      audioRef.current = audio;
    }
    return audioRef.current;
  }, [volume]);

  const play = useCallback(
    (station: Station) => {
      if (!isPublicHttpUrl(station.url_resolved)) return;
      const audio = getAudio();
      const isSameStation = current?.stationuuid === station.stationuuid;

      if (isSameStation && !audio.paused) {
        audio.pause();
        return;
      }

      setCurrent(station);
      setIsLoading(true);
      setElapsed(0);
      audio.src = station.url_resolved;
      audio.play().catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
      });

      const next = [
        station,
        ...readRecent().filter((s) => s.stationuuid !== station.stationuuid),
      ].slice(0, RECENT_MAX);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable — recently played just won't persist
      }
      setRecentlyPlayed(next);
    },
    [current, getAudio]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [current]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const historyIndex = current
    ? recentlyPlayed.findIndex((s) => s.stationuuid === current.stationuuid)
    : -1;
  const canGoPrevious = historyIndex >= 0 && historyIndex < recentlyPlayed.length - 1;
  const canGoNext = historyIndex > 0;

  const previous = useCallback(() => {
    if (canGoPrevious) play(recentlyPlayed[historyIndex + 1]);
  }, [canGoPrevious, historyIndex, recentlyPlayed, play]);

  const next = useCallback(() => {
    if (canGoNext) play(recentlyPlayed[historyIndex - 1]);
  }, [canGoNext, historyIndex, recentlyPlayed, play]);

  const shuffle = useCallback(() => {
    const pool = recentlyPlayed.filter((s) => s.stationuuid !== current?.stationuuid);
    if (pool.length === 0) return;
    play(pool[Math.floor(Math.random() * pool.length)]);
  }, [recentlyPlayed, current, play]);

  const toggleAutoRetry = useCallback(() => setAutoRetry((v) => !v), []);

  // Media Session API: lock-screen / Bluetooth / OS media-widget controls.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!current) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.name,
      artist: current.country || "Internet Radio",
      album: "Airwave",
      artwork: current.favicon ? [{ src: current.favicon, sizes: "512x512", type: "image/png" }] : [],
    });
  }, [current]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isLoading ? "none" : isPlaying ? "playing" : "paused";
  }, [isPlaying, isLoading]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.setActionHandler("play", toggle);
    navigator.mediaSession.setActionHandler("pause", toggle);
    navigator.mediaSession.setActionHandler("previoustrack", previous);
    navigator.mediaSession.setActionHandler("nexttrack", next);
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, [toggle, previous, next]);

  return (
    <PlayerContext.Provider
      value={{
        current,
        isPlaying,
        isLoading,
        volume,
        recentlyPlayed,
        elapsed,
        canGoPrevious,
        canGoNext,
        autoRetry,
        play,
        toggle,
        setVolume,
        previous,
        next,
        shuffle,
        toggleAutoRetry,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

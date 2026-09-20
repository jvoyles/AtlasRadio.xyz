"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Station } from "@/lib/radioBrowser";
import { sanitizeStations } from "@/lib/sanitize";

// Favorites live in this browser's localStorage — there are no accounts, so
// nothing is stored server-side. A tiny external store keeps every heart
// button (list rows, player bar, now-playing view) in sync.

const STORAGE_KEY = "atlasradio:favorites";
const LEGACY_STORAGE_KEY = "airwave:favorites";
const EMPTY: Station[] = [];

let cache: Station[] | null = null;
const listeners = new Set<() => void>();

function read(): Station[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    cache = raw ? sanitizeStations(JSON.parse(raw)) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Station[]) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, read, () => EMPTY);

  const isFavorite = useCallback(
    (stationuuid: string) => favorites.some((f) => f.stationuuid === stationuuid),
    [favorites]
  );

  const toggleFavorite = useCallback((station: Station) => {
    const current = read();
    if (current.some((f) => f.stationuuid === station.stationuuid)) {
      write(current.filter((f) => f.stationuuid !== station.stationuuid));
    } else {
      write([
        {
          stationuuid: station.stationuuid,
          name: station.name,
          url_resolved: station.url_resolved,
          favicon: station.favicon,
          tags: station.tags,
          country: station.country,
        },
        ...current,
      ]);
    }
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  searchStations,
  loadAllGeoStations,
  topStations,
  registerClick,
  stationByUuid,
  type Station,
} from "@/lib/radioBrowser";
import { SignalRow } from "@/components/SignalRow";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePlayer } from "@/context/PlayerContext";

// The map library is ~800 KB, so it only loads when the globe is actually
// shown — the Trending, Liked and search views never download it.
const Globe = dynamic(() => import("@/components/Globe").then((m) => m.Globe), {
  ssr: false,
  loading: () => <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, #0C1B33 0%, #081222 100%)" }} />,
});

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseWithKey />
    </Suspense>
  );
}

function BrowseWithKey() {
  const searchParams = useSearchParams();
  return <Browse key={`${searchParams.get("section")}:${searchParams.get("q")}`} />;
}

function Browse() {
  const { play, current } = usePlayer();
  const router = useRouter();
  const searchParams = useSearchParams();

  const showTrending = searchParams.get("section") === "trending";
  const query = (searchParams.get("q") ?? "").trim();

  const [trending, setTrending] = useState<Station[]>([]);
  const [geoStations, setGeoStations] = useState<Station[]>([]);
  const [resultSet, setResultSet] = useState<{ query: string; stations: Station[] }>({ query: "", stations: [] });

  useEffect(() => {
    topStations(50).then(setTrending).catch(() => setTrending([]));
    const controller = new AbortController();
    loadAllGeoStations(setGeoStations, controller.signal).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!query) return;
    let active = true;
    searchStations({ name: query, limit: 200 })
      .then((stations) => active && setResultSet({ query, stations }))
      .catch(() => active && setResultSet({ query, stations: [] }));
    return () => {
      active = false;
    };
  }, [query]);

  // Shared links (/?station=<uuid>) cue that station: the player loads it and
  // the globe glides there. Browsers block autoplay without a click, so the
  // listener may still need to press play.
  const sharedId = searchParams.get("station");
  const openedShared = useRef<string | null>(null);
  useEffect(() => {
    if (!sharedId || openedShared.current === sharedId) return;
    openedShared.current = sharedId;
    stationByUuid(sharedId)
      .then((station) => {
        if (station) play(station);
      })
      .catch(() => {})
      .finally(() => router.replace("/"));
  }, [sharedId, play, router]);

  const handlePlay = (station: Station) => {
    registerClick(station.stationuuid).catch(() => {});
    play(station);
  };

  if (!query && !showTrending) {
    return (
      <div className="absolute inset-0">
        <h1 className="sr-only">Atlas Radio: live radio stations from around the world</h1>
        <Link
          href="/?section=trending"
          className="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-3 focus:z-40 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
        >
          The globe is a visual map. Browse stations as a list instead
        </Link>
        <Globe stations={geoStations} currentId={current?.stationuuid ?? null} onSelect={handlePlay} />
      </div>
    );
  }

  const loading = Boolean(query) && resultSet.query !== query;
  const stations = query ? resultSet.stations : trending;

  return (
    <div className="px-6 sm:px-8 pt-24 pb-32">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{query ? `Results for “${query}”` : "Trending"}</h1>
        {query && (
          <button onClick={() => router.push("/")} className="text-sm font-bold text-muted hover:text-foreground">
            ← Back to globe
          </button>
        )}
      </div>

      {query && loading ? (
        <p className="text-muted text-sm">Searching stations…</p>
      ) : stations.length === 0 ? (
        <p className="text-muted text-sm">No stations found.</p>
      ) : (
        <div className="flex flex-col -mx-6 sm:-mx-8">
          {stations.map((station, i) => (
            <SignalRow key={station.stationuuid} index={i} station={station} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  searchStations,
  loadAllGeoStations,
  topStations,
  registerClick,
  type Station,
} from "@/lib/radioBrowser";
import { SignalRow } from "@/components/SignalRow";
import { Globe } from "@/components/Globe";
import { usePlayer } from "@/context/PlayerContext";

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

  const handlePlay = (station: Station) => {
    registerClick(station.stationuuid).catch(() => {});
    play(station);
  };

  if (!query && !showTrending) {
    return (
      <div className="absolute inset-0">
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

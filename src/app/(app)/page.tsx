"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  listCountries,
  searchStations,
  stationsWithGeo,
  topStations,
  registerClick,
  type Station,
} from "@/lib/radioBrowser";
import { SignalRow } from "@/components/SignalRow";
import { GenreTile } from "@/components/GenreTile";
import { Globe } from "@/components/Globe";
import { usePlayer } from "@/context/PlayerContext";
import { useGenres } from "@/hooks/useGenres";
import { countryFlag } from "@/lib/format";

type Section = "home" | "trending" | "genres" | "countries";
type Country = { name: string; stationcount: number; iso_3166_1: string };

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseWithKey />
    </Suspense>
  );
}

function BrowseWithKey() {
  const searchParams = useSearchParams();
  return (
    <Browse
      key={`${searchParams.get("genre")}:${searchParams.get("section")}:${searchParams.get("country")}`}
    />
  );
}

function Browse() {
  const { play, current } = usePlayer();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSection: Section = searchParams.get("genre")
    ? "genres"
    : (searchParams.get("section") as Section | null) ?? "home";
  const [section, setSection] = useState<Section>(initialSection);
  const query = searchParams.get("q") ?? "";
  const [genre, setGenre] = useState<string | null>(searchParams.get("genre"));
  const [country, setCountry] = useState<string | null>(searchParams.get("country"));

  const [trending, setTrending] = useState<Station[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [geoStations, setGeoStations] = useState<Station[]>([]);
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const { genres, loading: genresLoading } = useGenres();

  const drilled = Boolean(query.trim() || genre || country);

  useEffect(() => {
    topStations(24).then(setTrending).catch(() => setTrending([]));
    listCountries(20).then(setCountries).catch(() => setCountries([]));
    stationsWithGeo(700).then(setGeoStations).catch(() => setGeoStations([]));
  }, []);

  useEffect(() => {
    if (!drilled) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = query.trim()
          ? await searchStations({ name: query.trim() })
          : genre
            ? await searchStations({ tag: genre })
            : await searchStations({ country: country! });
        if (active) setResults(data);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    const debounce = setTimeout(load, query ? 400 : 0);
    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [query, genre, country, drilled]);

  const clearDrill = () => {
    setGenre(null);
    setCountry(null);
    router.replace(section === "home" ? "/" : `/?section=${section}`);
  };

  const goToGenre = (tag: string) => {
    clearDrill();
    setSection("genres");
    setGenre(tag);
    router.replace(`/?genre=${encodeURIComponent(tag)}`);
  };

  const handlePlay = (station: Station) => {
    registerClick(station.stationuuid).catch(() => {});
    play(station);
  };

  const sectionTitle: Record<Exclude<Section, "home">, string> = {
    trending: "Trending",
    genres: "Genres",
    countries: "Countries",
  };

  if (section === "home" && !drilled) {
    return (
      <div className="absolute inset-0">
        <Globe stations={geoStations} currentId={current?.stationuuid ?? null} onSelect={handlePlay} />

        {geoStations.length > 0 && (
          <div className="pointer-events-none absolute bottom-28 left-6 flex flex-col gap-0.5">
            <p className="text-xs font-semibold font-serif text-foreground">Every signal, one planet</p>
            <p className="text-[11px] text-muted tabular-nums">{geoStations.length} signals in orbit</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-8 pt-24 pb-32">
      {section !== "home" && !drilled && <h1 className="text-2xl font-bold mb-6">{sectionTitle[section]}</h1>}

      {drilled ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {query ? `Results for "${query}"` : genre ? `${genre} stations` : `${country} stations`}
            </h2>
            <button onClick={clearDrill} className="text-sm font-bold text-muted hover:text-foreground">
              ← Back
            </button>
          </div>

          {loading ? (
            <p className="text-muted text-sm">Loading stations…</p>
          ) : results.length === 0 ? (
            <p className="text-muted text-sm">No stations found.</p>
          ) : (
            <div className="flex flex-col max-w-2xl">
              {results.map((station, i) => (
                <SignalRow key={station.stationuuid} index={i} station={station} />
              ))}
            </div>
          )}
        </>
      ) : section === "trending" ? (
        <div className="flex flex-col max-w-2xl">
          {trending.map((station, i) => (
            <SignalRow key={station.stationuuid} index={i} station={station} />
          ))}
        </div>
      ) : section === "genres" ? genresLoading ? (
        <p className="text-muted text-sm">Loading genres…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {genres.map((g) => (
            <GenreTile
              key={g.tag}
              label={g.label}
              gradient={g.gradient}
              active={false}
              onClick={() => goToGenre(g.tag)}
            />
          ))}
        </div>
      ) : section === "countries" ? (
        <div className="flex flex-col max-w-2xl">
          {countries.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setCountry(c.name)}
              className="group flex items-center gap-4 px-3 py-2.5 rounded-md hover:bg-surface-elevated text-left transition-colors"
            >
              <span className="text-sm text-muted w-6 shrink-0 tabular-nums">{i + 1}</span>
              <span className="w-10 h-10 rounded-md bg-surface-elevated flex items-center justify-center text-lg shrink-0">
                {countryFlag(c.iso_3166_1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-sm font-medium">{c.name}</span>
              </span>
              <span className="text-sm text-muted tabular-nums shrink-0">
                {c.stationcount.toLocaleString()} stations
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

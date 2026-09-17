"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  listCountries,
  searchStations,
  topStations,
  type Station,
} from "@/lib/radioBrowser";
import { SignalRow } from "@/components/SignalRow";
import { GenreTile } from "@/components/GenreTile";
import { CountryGrid } from "@/components/CountryGrid";
import { useGenres } from "@/hooks/useGenres";

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
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const { genres, loading: genresLoading } = useGenres();

  const drilled = Boolean(query.trim() || genre || country);

  useEffect(() => {
    topStations(24).then(setTrending).catch(() => setTrending([]));
    listCountries(80).then(setCountries).catch(() => setCountries([]));
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

  const sectionTitle: Record<Exclude<Section, "home">, string> = {
    trending: "Trending",
    genres: "Genres",
    countries: "Countries",
  };

  return (
    <div className="px-6 sm:px-8 pt-24 pb-32">
      {section === "home" && !drilled && (
        <h1 className="text-2xl font-bold mb-6">Browse by country</h1>
      )}
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
      ) : section === "countries" || section === "home" ? (
        <CountryGrid countries={countries} onSelectCountry={setCountry} />
      ) : null}
    </div>
  );
}

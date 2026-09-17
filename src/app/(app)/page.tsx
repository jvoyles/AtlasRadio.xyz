"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  listCountries,
  recentlyAdded,
  searchStations,
  topStations,
  registerClick,
  type Station,
} from "@/lib/radioBrowser";
import { SignalRow } from "@/components/SignalRow";
import { RailCard } from "@/components/RailCard";
import { GenreTile } from "@/components/GenreTile";
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

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {href && (
        <Link href={href} className="text-[13px] font-bold text-muted hover:text-foreground">
          Show all
        </Link>
      )}
    </div>
  );
}

function Browse() {
  const { play, recentlyPlayed } = usePlayer();
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
  const [fresh, setFresh] = useState<Station[]>([]);
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const { genres, loading: genresLoading } = useGenres();

  const drilled = Boolean(query.trim() || genre || country);

  useEffect(() => {
    topStations(24).then(setTrending).catch(() => setTrending([]));
    listCountries(20).then(setCountries).catch(() => setCountries([]));
    recentlyAdded(20).then(setFresh).catch(() => setFresh([]));
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

  const goToCountry = (name: string) => {
    clearDrill();
    setSection("countries");
    setCountry(name);
    router.replace(`/?section=countries&country=${encodeURIComponent(name)}`);
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

  return (
    <div className="px-6 sm:px-8 py-6">
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
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-6">Good listening</h1>

          {fresh.length > 0 && (
            <section className="mb-8">
              <SectionHeader title="New & Notable" />
              <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {fresh.slice(0, 10).map((s) => (
                  <RailCard
                    key={s.stationuuid}
                    image={s.favicon}
                    title={s.name}
                    subtitle={s.country || "Worldwide"}
                    onClick={() => handlePlay(s)}
                  />
                ))}
              </div>
            </section>
          )}

          {recentlyPlayed.length > 0 && (
            <section className="mb-8">
              <SectionHeader title="Recently played" />
              <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {recentlyPlayed.slice(0, 10).map((s) => (
                  <RailCard
                    key={s.stationuuid}
                    image={s.favicon}
                    title={s.name}
                    subtitle={s.country || "Worldwide"}
                    onClick={() => handlePlay(s)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="mb-8">
            <SectionHeader title="Trending now" href="/?section=trending" />
            <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {trending.slice(0, 10).map((s) => (
                <RailCard
                  key={s.stationuuid}
                  image={s.favicon}
                  title={s.name}
                  subtitle={s.country || "Worldwide"}
                  onClick={() => handlePlay(s)}
                />
              ))}
            </div>
          </section>

          <section className="mb-8">
            <SectionHeader title="Browse by genre" href="/?section=genres" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {genres.slice(0, 8).map((g) => (
                <GenreTile
                  key={g.tag}
                  label={g.label}
                  gradient={g.gradient}
                  active={false}
                  onClick={() => goToGenre(g.tag)}
                />
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Around the world" href="/?section=countries" />
            <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {countries.slice(0, 10).map((c) => (
                <RailCard
                  key={c.name}
                  round
                  icon={<span className="text-4xl">{countryFlag(c.iso_3166_1)}</span>}
                  title={c.name}
                  subtitle={`${c.stationcount.toLocaleString()} stations`}
                  onClick={() => goToCountry(c.name)}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

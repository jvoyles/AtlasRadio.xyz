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
import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useGenres } from "@/hooks/useGenres";
import { countryFlag } from "@/lib/format";

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.75"
  >
    <path d="M12 21s-7.5-4.6-10-9.2C.5 8.4 2 4.5 5.8 4c2-.3 3.8.7 5 2.4.9-1.7 2.9-2.7 4.9-2.4 3.8.5 5.3 4.4 3.8 7.8-2.5 4.6-10 9.2-10 9.2z" />
  </svg>
);

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
    <div className="flex items-center justify-between mb-2 pb-1 border-b border-border">
      <h2 className="text-[12px] uppercase tracking-[0.2em] text-muted">{title}</h2>
      {href && (
        <Link href={href} className="text-[12px] uppercase tracking-wide text-muted hover:text-live">
          All →
        </Link>
      )}
    </div>
  );
}

function Browse() {
  const { play, current, recentlyPlayed } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
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
    countries: "Areas",
  };

  const featured = current ?? trending[0] ?? null;
  const featuredFavorited = featured ? isFavorite(featured.stationuuid) : false;
  const handleFeaturedFavorite = async () => {
    if (!featured) return;
    const { needsAuth } = await toggleFavorite(featured);
    if (needsAuth) router.push("/login");
  };

  return (
    <div className="px-10 py-8">
      {section !== "home" && !drilled && (
        <h1 className="text-sm uppercase tracking-widest font-bold mb-6">{sectionTitle[section]}</h1>
      )}

      {drilled ? (
        <>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h2 className="text-[13px] uppercase tracking-wide text-muted">
              In re:{" "}
              <span className="text-foreground">
                {query ? `"${query}"` : genre ? `${genre} stations` : `${country} stations`}
              </span>
            </h2>
            <button onClick={clearDrill} className="text-[12px] uppercase tracking-wide text-muted hover:text-live">
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
        <div className="flex flex-col max-w-md">
          {genres.map((g, i) => (
            <button
              key={g.tag}
              onClick={() => goToGenre(g.tag)}
              className="flex items-center gap-3 py-2 border-b border-border text-left hover:text-live transition-colors"
            >
              <span className="text-[12px] text-muted w-6 shrink-0 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm">{g.label}</span>
            </button>
          ))}
        </div>
      ) : section === "countries" ? (
        <div className="flex flex-col max-w-2xl">
          {countries.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setCountry(c.name)}
              className="group flex items-center gap-3 py-2 border-b border-border text-left transition-colors"
            >
              <span className="text-[12px] text-muted w-6 shrink-0 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="shrink-0">{countryFlag(c.iso_3166_1)}</span>
              <span className="min-w-0 flex-1">
                <span className="text-sm group-hover:text-live transition-colors">{c.name}</span>
              </span>
              <span className="text-[12px] text-muted tabular-nums shrink-0">
                {c.stationcount.toLocaleString()} stations
              </span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <p className="text-[12px] uppercase tracking-wide text-muted mb-8 pb-3 border-b border-border">
            {trending.length} signals on record · {countries.length} areas reporting
          </p>

          {featured && (
            <section className="mb-10">
              <SectionHeader title={current ? "Now Playing" : "Featured Signal"} />
              <div className="flex items-center gap-3 py-2">
                <span className="text-sm flex-1 min-w-0 truncate">{featured.name}</span>
                <span className="text-[12px] text-muted truncate">
                  [{featured.country || "Worldwide"} — {featured.tags?.split(",")[0] || "radio"}]
                </span>
                <button
                  onClick={handleFeaturedFavorite}
                  className={featuredFavorited ? "text-live" : "text-muted hover:text-foreground"}
                  aria-label="Toggle favorite"
                >
                  <HeartIcon filled={featuredFavorited} />
                </button>
                <button
                  onClick={() => handlePlay(featured)}
                  className="px-3 py-1 border border-live text-live text-[12px] uppercase tracking-wide hover:bg-live hover:text-background transition-colors"
                >
                  {current?.stationuuid === featured.stationuuid ? "Playing" : "Play"}
                </button>
              </div>
            </section>
          )}

          {fresh.length > 0 && (
            <section className="mb-10">
              <SectionHeader title="New & Notable" />
              <div className="flex flex-col max-w-2xl">
                {fresh.slice(0, 6).map((s, i) => (
                  <SignalRow key={s.stationuuid} index={i} station={s} />
                ))}
              </div>
            </section>
          )}

          {recentlyPlayed.length > 0 && (
            <section className="mb-10">
              <SectionHeader title="Recently Played" />
              <div className="flex flex-col max-w-2xl">
                {recentlyPlayed.slice(0, 6).map((s, i) => (
                  <SignalRow key={s.stationuuid} index={i} station={s} />
                ))}
              </div>
            </section>
          )}

          <section className="mb-10">
            <SectionHeader title="Trending Now" href="/?section=trending" />
            <div className="flex flex-col max-w-2xl">
              {trending.slice(0, 6).map((s, i) => (
                <SignalRow key={s.stationuuid} index={i} station={s} />
              ))}
            </div>
          </section>

          <section className="mb-10">
            <SectionHeader title="Browse by Genre" href="/?section=genres" />
            <div className="flex flex-wrap gap-x-6 gap-y-1 max-w-2xl">
              {genres.slice(0, 12).map((g) => (
                <button
                  key={g.tag}
                  onClick={() => goToGenre(g.tag)}
                  className="text-sm text-muted hover:text-live py-1 transition-colors"
                >
                  {g.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Areas Reporting" href="/?section=countries" />
            <div className="flex flex-col max-w-2xl">
              {countries.slice(0, 6).map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => goToCountry(c.name)}
                  className="group flex items-center gap-3 py-2 border-b border-border text-left transition-colors"
                >
                  <span className="text-[12px] text-muted w-6 shrink-0 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="shrink-0">{countryFlag(c.iso_3166_1)}</span>
                  <span className="min-w-0 flex-1 text-sm group-hover:text-live transition-colors">
                    {c.name}
                  </span>
                  <span className="text-[12px] text-muted tabular-nums shrink-0">
                    {c.stationcount.toLocaleString()} stations
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

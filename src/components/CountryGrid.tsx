"use client";

import { countryFlag } from "@/lib/format";

type Country = { name: string; stationcount: number; iso_3166_1: string };

function hueFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function CountryCard({ country, onClick }: { country: Country; onClick: () => void }) {
  const hue = hueFor(country.name);
  const accent = `hsl(${hue}, 70%, 58%)`;
  return (
    <button
      onClick={onClick}
      style={{ "--card-accent": accent } as React.CSSProperties}
      className="group relative rounded-xl bg-surface border border-border overflow-hidden text-left p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--card-accent)] hover:shadow-[0_0_24px_-6px_var(--card-accent)]"
    >
      <span
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: accent, boxShadow: `0 0 12px 0 ${accent}` }}
      />
      <span className="text-2xl leading-none">{countryFlag(country.iso_3166_1)}</span>
      <p className="mt-3 text-sm font-semibold font-serif text-foreground line-clamp-2 leading-snug min-h-[2.5em]">{country.name}</p>
      <p className="text-xs text-muted tabular-nums mt-0.5">
        {country.stationcount.toLocaleString()} stations
      </p>
    </button>
  );
}

export function CountryGrid({
  countries,
  onSelectCountry,
}: {
  countries: Country[];
  onSelectCountry: (name: string) => void;
}) {
  return (
    <div className="relative">
      <div className="ambient-glow absolute inset-0 -z-10 overflow-hidden" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {countries.map((country) => (
          <CountryCard
            key={country.name}
            country={country}
            onClick={() => onSelectCountry(country.name)}
          />
        ))}
      </div>
    </div>
  );
}

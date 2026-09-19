"use client";

import Link from "next/link";
import { useFavorites } from "@/hooks/useFavorites";
import { SignalRow } from "@/components/SignalRow";

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <div className="px-6 sm:px-8 pt-24 pb-32">
      <h1 className="text-2xl font-bold mb-6">Liked stations</h1>
      {favorites.length === 0 ? (
        <p className="text-muted text-sm">
          No liked stations yet — head to{" "}
          <Link href="/" className="text-accent hover:underline">
            the globe
          </Link>{" "}
          and tap the heart on a station. Likes are saved in this browser.
        </p>
      ) : (
        <div className="flex flex-col -mx-6 sm:-mx-8">
          {favorites.map((station, i) => (
            <SignalRow key={station.stationuuid} index={i} station={station} />
          ))}
        </div>
      )}
    </div>
  );
}

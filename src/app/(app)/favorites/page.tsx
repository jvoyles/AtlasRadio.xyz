"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { SignalRow } from "@/components/SignalRow";
import type { Station } from "@/lib/radioBrowser";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading } = useFavorites();

  if (authLoading || loading) {
    return <div className="px-10 py-8 text-muted text-sm">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="px-10 py-8 max-w-md">
        <h1 className="text-2xl font-bold mb-6">Favorites</h1>
        <p className="text-muted text-sm mb-4">Log in to save and view your favorite stations.</p>
        <Link
          href="/login"
          className="inline-block px-5 py-2 rounded-full bg-accent text-background text-sm font-bold hover:bg-accent-hover"
        >
          Log in
        </Link>
      </div>
    );
  }

  const stations: Station[] = favorites.map((f) => ({
    stationuuid: f.station_uuid,
    name: f.station_name,
    url_resolved: f.stream_url,
    favicon: f.favicon || "",
    tags: f.tags || "",
    country: f.country || "",
  }));

  return (
    <div className="px-10 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Favorites</h1>
      {stations.length === 0 ? (
        <p className="text-muted text-sm">
          No favorites yet — head to{" "}
          <Link href="/" className="text-accent hover:underline">
            Browse
          </Link>{" "}
          and tap the heart on a station.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {stations.map((station, i) => (
            <SignalRow key={station.stationuuid} index={i} station={station} />
          ))}
        </div>
      )}
    </div>
  );
}

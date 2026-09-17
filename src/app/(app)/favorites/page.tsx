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
        <h1 className="text-sm uppercase tracking-widest font-bold mb-6">Liked Stations</h1>
        <p className="text-muted text-sm mb-4">Log in to save and view your favorite stations.</p>
        <Link
          href="/login"
          className="inline-block px-5 py-2 border border-live text-live text-sm font-bold uppercase tracking-wide hover:bg-live hover:text-background transition-colors"
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
      <h1 className="text-sm uppercase tracking-widest font-bold mb-6">Liked Stations</h1>
      {stations.length === 0 ? (
        <p className="text-muted text-sm">
          No favorites yet — head to{" "}
          <Link href="/" className="text-live hover:underline">
            Browse
          </Link>{" "}
          and tap the heart on a station.
        </p>
      ) : (
        <div className="flex flex-col max-w-2xl">
          {stations.map((station, i) => (
            <SignalRow key={station.stationuuid} index={i} station={station} />
          ))}
        </div>
      )}
    </div>
  );
}

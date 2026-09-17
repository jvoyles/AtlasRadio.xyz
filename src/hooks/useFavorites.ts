"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Station } from "@/lib/radioBrowser";

export type Favorite = {
  station_uuid: string;
  station_name: string;
  stream_url: string;
  favicon: string | null;
  country: string | null;
  tags: string | null;
};

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("favorites")
      .select("station_uuid, station_name, stream_url, favicon, country, tags")
      .order("created_at", { ascending: false });
    setFavorites(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const run = async () => {
      await refresh();
    };
    run();
  }, [refresh]);

  const isFavorite = useCallback(
    (stationuuid: string) => favorites.some((f) => f.station_uuid === stationuuid),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (station: Station) => {
      if (!user) return { needsAuth: true };
      const supabase = createClient();

      if (isFavorite(station.stationuuid)) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("station_uuid", station.stationuuid);
      } else {
        await supabase.from("favorites").insert({
          user_id: user.id,
          station_uuid: station.stationuuid,
          station_name: station.name,
          stream_url: station.url_resolved,
          favicon: station.favicon || null,
          country: station.country || null,
          tags: station.tags || null,
        });
      }
      await refresh();
      return { needsAuth: false };
    },
    [user, isFavorite, refresh]
  );

  return { favorites, loading, isFavorite, toggleFavorite };
}

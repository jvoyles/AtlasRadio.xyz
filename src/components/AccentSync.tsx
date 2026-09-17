"use client";

import { usePlayer } from "@/context/PlayerContext";
import { useStationAccent } from "@/hooks/useStationAccent";

export function AccentSync() {
  const { current } = usePlayer();
  useStationAccent(current);
  return null;
}

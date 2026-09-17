"use client";

import { useEffect, useState } from "react";
import { listTags } from "@/lib/radioBrowser";

export type Genre = { tag: string; label: string; gradient: string };

const GRADIENTS = [
  "from-pink-500 to-rose-700",
  "from-orange-600 to-red-800",
  "from-amber-600 to-yellow-800",
  "from-indigo-500 to-purple-800",
  "from-slate-500 to-slate-800",
  "from-cyan-600 to-blue-800",
  "from-fuchsia-500 to-violet-800",
  "from-yellow-500 to-orange-700",
  "from-lime-600 to-green-800",
  "from-green-500 to-emerald-800",
  "from-purple-500 to-pink-700",
  "from-teal-500 to-cyan-800",
];

// Radio Browser's tag list is community-submitted and noisy (URLs, station
// names, single characters). This keeps only tags that read as real genre
// words, so "Browse by Genre" stays trustworthy.
const DISPLAYABLE = /^[a-zA-Z][a-zA-Z0-9 &'-]{1,18}$/;

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function gradientFor(tag: string) {
  return GRADIENTS[hash(tag) % GRADIENTS.length];
}

function titleCase(tag: string) {
  return tag.replace(/\b\w/g, (c) => c.toUpperCase());
}

let cache: Genre[] | null = null;

export function useGenres() {
  const [genres, setGenres] = useState<Genre[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let active = true;

    listTags(300)
      .then((tags) => {
        const shaped = tags
          .filter((t) => t.stationcount >= 20 && DISPLAYABLE.test(t.name.trim()))
          .slice(0, 40)
          .map((t) => ({ tag: t.name, label: titleCase(t.name), gradient: gradientFor(t.name) }));
        if (!active) return;
        cache = shaped;
        setGenres(shaped);
      })
      .catch(() => {
        if (active) setGenres([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { genres, loading };
}

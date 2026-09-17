"use client";

import { useEffect } from "react";
import type { Station } from "@/lib/radioBrowser";

const DEFAULT_HUE_1 = 168;
const DEFAULT_HUE_2 = 190;

function hashHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 360;
}

function rgbToHue(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return null;
  let hue: number;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  return hue < 0 ? hue + 360 : hue;
}

function setHues(h1: number, h2: number) {
  const root = document.documentElement.style;
  root.setProperty("--hue1", String(h1));
  root.setProperty("--hue2", String(h2));
}

async function extractHue(favicon: string): Promise<number | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 12;
        canvas.height = 12;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, 12, 12);
        const { data } = ctx.getImageData(0, 0, 12, 12);
        let r = 0,
          g = 0,
          b = 0,
          n = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 20) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
        if (n === 0) return resolve(null);
        resolve(rgbToHue(r / n, g / n, b / n));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = favicon;
  });
}

/** Drives the page-wide gradient canvas from the currently playing station's
 * own art color when it can be sampled (many third-party favicons block
 * cross-origin pixel reads), falling back to a stable per-station hue. */
export function useStationAccent(station: Station | null) {
  useEffect(() => {
    let cancelled = false;

    if (!station) {
      setHues(DEFAULT_HUE_1, DEFAULT_HUE_2);
      return;
    }

    const fallback = hashHue(station.stationuuid);
    setHues(fallback, (fallback + 40) % 360);

    if (station.favicon) {
      extractHue(station.favicon).then((hue) => {
        if (cancelled || hue === null) return;
        setHues(hue, (hue + 40) % 360);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [station]);
}

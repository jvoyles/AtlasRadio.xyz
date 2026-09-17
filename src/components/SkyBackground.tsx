"use client";

import { useEffect, useRef } from "react";

const TILE_W = 1600;
const TILE_H = 500;

function hash2(x: number, y: number) {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

function noise2(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const a = hash2(xi, yi), b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

function fbm2(x: number, y: number, octaves: number) {
  let sum = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x * freq, y * freq);
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / max;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (lo: number, hi: number, x: number) => {
  const t = clamp((x - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
};

type Cluster = { cx: number; cy: number; r: number; seed: number; squashX: number };

function rand(seed: number) {
  return hash2(seed * 12.9898, seed * 78.233);
}

// A handful of individually-placed, individually-shaped cumulus clusters —
// not a continuous noise field — because real scattered cloud cover is
// mostly open sky with a few distinct puffs, not an even texture. Each
// cluster is a soft radial falloff perturbed by its own fbm noise (so the
// silhouette is organic, not a circle), drawn at three x-offsets so it
// still wraps seamlessly across the tile's left/right seam.
function makeClusters(): Cluster[] {
  const count = 7;
  const clusters: Cluster[] = [];
  for (let i = 0; i < count; i++) {
    const cx = (i / count) * TILE_W + (rand(i * 3.1 + 1) - 0.5) * (TILE_W / count) * 0.7;
    const cy = TILE_H * 0.22 + rand(i * 5.3 + 2) * TILE_H * 0.4;
    const isHero = i === Math.floor(count * 0.4);
    const r = (isHero ? 105 : 34) + rand(i * 7.9 + 3) * (isHero ? 55 : 34);
    clusters.push({ cx, cy, r, seed: i * 91.7 + 13, squashX: 1.15 + rand(i * 4.4) * 0.5 });
  }
  return clusters;
}

function clusterDensity(px: number, py: number, c: Cluster) {
  let best = 0;
  for (const dx of [-TILE_W, 0, TILE_W]) {
    const ox = px - (c.cx + dx);
    const oy = py - c.cy;
    const dist = Math.sqrt((ox / c.squashX) * (ox / c.squashX) + oy * oy) / c.r;
    if (dist > 1.4) continue;
    const shapeNoise = fbm2(ox / (c.r * 0.55) + c.seed, oy / (c.r * 0.55) + c.seed, 4);
    const falloff = smoothstep(1.25, 0.35, dist);
    const puff = falloff * (0.35 + 0.75 * shapeNoise);
    if (puff > best) best = puff;
  }
  return best;
}

function makeCloudTile() {
  const canvas = document.createElement("canvas");
  canvas.width = TILE_W;
  canvas.height = TILE_H;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(TILE_W, TILE_H);
  const data = image.data;

  const clusters = makeClusters();
  const lightDx = -6;
  const lightDy = -9;

  const sampleAll = (px: number, py: number) => {
    let total = 0;
    for (const c of clusters) total = Math.max(total, clusterDensity(px, py, c));
    return smoothstep(0.18, 0.65, total);
  };

  for (let py = 0; py < TILE_H; py++) {
    for (let px = 0; px < TILE_W; px++) {
      const density = sampleAll(px, py);
      const i = (py * TILE_W + px) * 4;
      if (density < 0.015) {
        data[i + 3] = 0;
        continue;
      }

      const lit = sampleAll(px + lightDx, py + lightDy);
      const shadow = clamp(lit - density, 0, 1) * 0.55;
      const brightness = clamp(0.8 + density * 0.32 - shadow, 0.4, 1);

      const shade = [158, 178, 205];
      const white = [255, 255, 255];
      data[i] = mix(shade[0], white[0], brightness);
      data[i + 1] = mix(shade[1], white[1], brightness);
      data[i + 2] = mix(shade[2], white[2], brightness);
      data[i + 3] = smoothstep(0.015, 0.3, density) * 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

export function SkyBackground() {
  const fastRef = useRef<HTMLDivElement>(null);
  const slowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tile = `url(${makeCloudTile()})`;
    if (fastRef.current) fastRef.current.style.backgroundImage = tile;
    if (slowRef.current) slowRef.current.style.backgroundImage = tile;
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, #1c73c9 0%, #4b96db 40%, #a9cfe9 78%, #eef4f8 100%)",
        }}
      />
      <div
        ref={slowRef}
        className="sky-clouds-slow absolute inset-0"
        style={{
          backgroundRepeat: "repeat-x",
          backgroundSize: `${TILE_W * 1.3}px auto`,
          backgroundPosition: "0 8%",
          opacity: 0.5,
        }}
      />
      <div
        ref={fastRef}
        className="sky-clouds absolute inset-0"
        style={{
          backgroundRepeat: "repeat-x",
          backgroundSize: `${TILE_W}px auto`,
          backgroundPosition: "0 32%",
          opacity: 0.95,
        }}
      />
    </div>
  );
}

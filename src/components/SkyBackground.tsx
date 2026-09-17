"use client";

import { useEffect, useRef } from "react";

const TILE_W = 1024;
const TILE_H = 512;

function hash3(x: number, y: number, z: number) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = zf * zf * (3 - 2 * zf);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c000 = hash3(xi, yi, zi), c100 = hash3(xi + 1, yi, zi);
  const c010 = hash3(xi, yi + 1, zi), c110 = hash3(xi + 1, yi + 1, zi);
  const c001 = hash3(xi, yi, zi + 1), c101 = hash3(xi + 1, yi, zi + 1);
  const c011 = hash3(xi, yi + 1, zi + 1), c111 = hash3(xi + 1, yi + 1, zi + 1);
  const x00 = lerp(c000, c100, u), x10 = lerp(c010, c110, u);
  const x01 = lerp(c001, c101, u), x11 = lerp(c011, c111, u);
  const y0 = lerp(x00, x10, v), y1 = lerp(x01, x11, v);
  return lerp(y0, y1, w);
}

function fbm(x: number, y: number, z: number, octaves: number) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise3(x * freq, y * freq, z * freq);
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

// Real cumulus clouds are volumetric noise, not flat blobs: layered fractal
// noise shapes the coverage, a second high-frequency layer adds wispy
// turbulence at the edges, and a light-direction sample darkens each puff's
// underside. Sampling on (cos theta, sin theta, y) makes it wrap seamlessly
// at the tile's left/right seam — the same trick used for the app's globe
// textures, applied to a flat tile instead of a sphere.
function makeCloudTile() {
  const canvas = document.createElement("canvas");
  canvas.width = TILE_W;
  canvas.height = TILE_H;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(TILE_W, TILE_H);
  const data = image.data;

  const SKY = [190, 220, 245];
  const regionRadius = 3;
  const shapeRadius = 9;
  const detailRadius = 30;
  const coverage = 0.62;
  const lightDx = -0.015;
  const lightDy = -0.03;

  // Both layers sample the same angle (theta), just scaled to a different
  // circle radius — that keeps each one exactly 2*pi-periodic in u, so the
  // tile wraps with no seam no matter how the two frequencies relate.
  // The x/z axes move along a circle of circumference 2*pi*radius over the
  // tile's width; y needs a matching rate (circumference / height) or noise
  // barely changes top-to-bottom, reading as vertical stripes instead of
  // an isotropic field.
  const yScale = (radius: number) => ((2 * Math.PI * radius) / TILE_W) * TILE_H;
  const regionYScale = yScale(regionRadius);
  const shapeYScale = yScale(shapeRadius);
  const detailYScale = yScale(detailRadius);

  const sampleDensity = (u: number, v: number) => {
    const theta = u * Math.PI * 2;

    // A large-scale mask carves out real gaps of open sky between cloud
    // masses, instead of an even marbled coverage across the whole tile.
    const region = fbm(Math.cos(theta) * regionRadius, Math.sin(theta) * regionRadius, v * regionYScale, 4);
    const regionMask = smoothstep(0.42, 0.62, region);
    if (regionMask <= 0.001) return 0;

    const shape = fbm(Math.cos(theta) * shapeRadius, Math.sin(theta) * shapeRadius, v * shapeYScale, 5);
    const detail = fbm(Math.cos(theta) * detailRadius, Math.sin(theta) * detailRadius, v * detailYScale, 3);

    const base = smoothstep(1 - coverage, 1 - coverage + 0.16, shape);
    return clamp(base * (0.5 + 0.6 * detail) * regionMask, 0, 1);
  };

  for (let py = 0; py < TILE_H; py++) {
    const v = py / TILE_H;
    for (let px = 0; px < TILE_W; px++) {
      const u = px / TILE_W;
      const density = sampleDensity(u, v);

      let r = SKY[0], g = SKY[1], b = SKY[2], a = 0;
      if (density > 0.02) {
        const lit = sampleDensity(u + lightDx, v + lightDy);
        const shadow = clamp(lit - density, 0, 1) * 0.6;
        const brightness = clamp(0.82 + density * 0.3 - shadow, 0.35, 1);

        const puffWhite = [255, 255, 255];
        const puffShadow = [150, 168, 195];
        const base = [
          mix(puffShadow[0], puffWhite[0], brightness),
          mix(puffShadow[1], puffWhite[1], brightness),
          mix(puffShadow[2], puffWhite[2], brightness),
        ];

        const edgeSoftness = smoothstep(0, 0.35, density);
        r = mix(SKY[0], base[0], edgeSoftness);
        g = mix(SKY[1], base[1], edgeSoftness);
        b = mix(SKY[2], base[2], edgeSoftness);
        a = smoothstep(0.02, 0.4, density) * 255;
      }

      const i = (py * TILE_W + px) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
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
          background: "linear-gradient(to bottom, #2f7fd6 0%, #6bb0e8 45%, #bcdcf2 80%, #e4f0f7 100%)",
        }}
      />
      <div
        ref={fastRef}
        className="sky-clouds absolute inset-0"
        style={{
          backgroundRepeat: "repeat-x",
          backgroundSize: `${TILE_W}px auto`,
          backgroundPosition: "0 20%",
          opacity: 0.9,
        }}
      />
      <div
        ref={slowRef}
        className="sky-clouds-slow absolute inset-0"
        style={{
          backgroundRepeat: "repeat-x",
          backgroundSize: `${TILE_W * 1.6}px auto`,
          backgroundPosition: "0 55%",
          opacity: 0.55,
        }}
      />
    </div>
  );
}

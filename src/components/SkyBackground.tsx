"use client";

import { useEffect, useRef, useState } from "react";

// The rooftop sliver in the source photo's bottom-left corner gets cropped
// off here so only real sky and cloud remain.
const CROP_BOTTOM_PX = 140;

function loadCroppedSky(onReady: (dataUrl: string) => void) {
  const img = new Image();
  img.src = "/textures/sky-source.jpg";
  img.onload = () => {
    const height = img.naturalHeight - CROP_BOTTOM_PX;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, img.naturalWidth, height, 0, 0, img.naturalWidth, height);
    onReady(canvas.toDataURL("image/jpeg", 0.92));
  };
}

// A pure integer hash (Math.imul + bitwise ops only) instead of
// Math.sin-based hashing: transcendental functions can differ in their
// last bit between the server's and browser's JS engine, which is enough
// to flip a rendered percentage and fail hydration. Integer ops are
// bit-exact per the spec, so server and client always agree.
function hash(seed: number) {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

type DriftCloud = {
  top: number;
  width: number;
  height: number;
  duration: number;
  delay: number;
  opacity: number;
  filter: "back" | "mid" | "front";
  blur: number;
};

// A handful of independently drifting cloud shapes on top of the static
// photo — a soft blob whose silhouette is warped organic (not a rounded
// rectangle) by an SVG feTurbulence/feDisplacementMap filter, the same
// technique used by the reference the user pointed to. The real photo
// behind them supplies photographic realism; these supply visible motion,
// since panning one static photo reads as the whole sky sliding, not
// clouds drifting independently.
function makeDriftClouds(): DriftCloud[] {
  const filters: DriftCloud["filter"][] = ["back", "mid", "front"];
  return Array.from({ length: 9 }, (_, i) => {
    const depth = filters[i % filters.length];
    const isBack = depth === "back";
    return {
      top: 4 + hash(i * 3.1 + 1) * 42,
      width: (isBack ? 260 : 160) + hash(i * 5.3 + 2) * 220,
      height: (isBack ? 90 : 60) + hash(i * 7.1 + 3) * 60,
      duration: (isBack ? 150 : 90) + hash(i * 9.7 + 4) * 90,
      delay: -hash(i * 4.4 + 5) * 200,
      opacity: isBack ? 0.55 + hash(i * 2.2) * 0.15 : 0.75 + hash(i * 2.2) * 0.2,
      filter: depth,
      blur: isBack ? 3 : 1.5,
    };
  });
}

export function SkyBackground() {
  const photoRef = useRef<HTMLDivElement>(null);
  const [clouds] = useState(makeDriftClouds);

  useEffect(() => {
    loadCroppedSky((dataUrl) => {
      if (photoRef.current) photoRef.current.style.backgroundImage = `url(${dataUrl})`;
    });
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, #1c5fa8 0%, #3f83c2 55%, #a9c9dd 100%)",
        }}
      />
      <div
        ref={photoRef}
        className="absolute inset-0"
        style={{
          backgroundSize: "auto 190%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "35% 35%",
        }}
      />
      <svg width="0" height="0">
        <defs>
          <filter id="cloud-filter-back">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="60" />
          </filter>
          <filter id="cloud-filter-mid">
            <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="3" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="45" />
          </filter>
          <filter id="cloud-filter-front">
            <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="11" />
            <feDisplacementMap in="SourceGraphic" scale="35" />
          </filter>
        </defs>
      </svg>
      {clouds.map((c, i) => (
        <div
          key={i}
          className="drift-cloud absolute rounded-[45%] bg-white"
          style={{
            top: `${c.top}%`,
            width: c.width,
            height: c.height,
            opacity: c.opacity,
            filter: `url(#cloud-filter-${c.filter}) blur(${c.blur}px)`,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

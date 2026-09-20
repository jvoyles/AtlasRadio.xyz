import type { Map as MapLibreMap, StyleImageInterface } from "maplibre-gl";
import type { Station } from "@/lib/radioBrowser";

// MapLibre re-reads a StyleImageInterface's pixel buffer every frame when
// render() returns true, so each dot animates on the GPU-side icon atlas
// without touching GeoJSON or paint properties. Several phase-offset
// variants are registered so the globe's dots breathe out of sync.

const PIXEL_RATIO = 2;

export const DOT_RGB: [number, number, number] = [255, 106, 43];
export const DOT_HEX = "#ff6a2b";

type DotOptions = {
  size: number;
  core: number;
  color: [number, number, number];
  coreColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadow?: boolean;
  period: number;
  phase: number;
  ringAlpha: number;
  rings?: number;
};

function createPulsingDot(opts: DotOptions): StyleImageInterface & { data: Uint8ClampedArray } {
  const px = opts.size * PIXEL_RATIO;
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const [r, g, b] = opts.color;
  let lastPaint = 0;
  let drawn = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const image = {
    width: px,
    height: px,
    data: new Uint8ClampedArray(px * px * 4),
    render() {
      const now = performance.now();
      // ~30 fps is plenty for a slow pulse and halves the per-frame canvas readback work.
      if (now - lastPaint < 33 || (reduceMotion && drawn)) return false;
      drawn = true;
      lastPaint = now;
      const t = (((now / 1000) / opts.period + opts.phase) % 1 + 1) % 1;
      const c = px / 2;
      const coreR = opts.core * PIXEL_RATIO;
      const maxR = c - 1;
      ctx.clearRect(0, 0, px, px);

      const ringCount = opts.rings ?? 1;
      for (let k = 0; k < ringCount; k++) {
        const rt = (t + k / ringCount) % 1;
        const ringR = coreR + (maxR - coreR) * (1 - Math.pow(1 - rt, 2.2));
        const ringA = Math.pow(1 - rt, 1.6) * opts.ringAlpha;
        ctx.beginPath();
        ctx.arc(c, c, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${ringA})`;
        ctx.lineWidth = 2 * PIXEL_RATIO * (1 - rt * 0.6);
        ctx.stroke();
      }

      const glow = ctx.createRadialGradient(c, c, coreR * 0.4, c, c, coreR * 2.2);
      glow.addColorStop(0, `rgba(${r},${g},${b},0.4)`);
      glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(c, c, coreR * 2.2, 0, Math.PI * 2);
      ctx.fill();

      const breathe = 1 + 0.08 * Math.sin(t * Math.PI * 2);
      ctx.beginPath();
      ctx.arc(c, c, coreR * breathe, 0, Math.PI * 2);
      ctx.fillStyle = opts.coreColor ?? `rgb(${r},${g},${b})`;
      if (opts.shadow) {
        ctx.shadowColor = "rgba(0,0,0,0.55)";
        ctx.shadowBlur = 8 * PIXEL_RATIO;
        ctx.shadowOffsetY = 1.5 * PIXEL_RATIO;
      }
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.lineWidth = (opts.strokeWidth ?? 1.2) * PIXEL_RATIO;
      ctx.strokeStyle = opts.strokeColor ?? "rgba(255,255,255,0.95)";
      ctx.stroke();

      image.data.set(ctx.getImageData(0, 0, px, px).data);
      return true;
    },
  };
  return image;
}

function createHoverRing(size: number): ImageData {
  const px = size * PIXEL_RATIO;
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  const c = px / 2;
  ctx.beginPath();
  ctx.arc(c, c, 13 * PIXEL_RATIO, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fill();
  ctx.lineWidth = 2 * PIXEL_RATIO;
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.stroke();
  return ctx.getImageData(0, 0, px, px);
}

export const DOT_VARIANTS = 4;
export const dotImageId = (variant: number) => `station-dot-${variant}`;
export const ACTIVE_DOT_IMAGE = "station-dot-active";
export const HOVER_RING_IMAGE = "station-hover-ring";

export function registerStationImages(map: MapLibreMap) {
  // Images only animate while the map re-renders, so keep it repainting at
  // the dots' 30 fps even when nothing else (spin, drag) is moving.
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const repaint = setInterval(() => map.triggerRepaint(), 33);
    map.once("remove", () => clearInterval(repaint));
  }
  for (let i = 0; i < DOT_VARIANTS; i++) {
    map.addImage(
      dotImageId(i),
      createPulsingDot({
        size: 40,
        core: 3.6,
        color: DOT_RGB,
        period: 2.6,
        phase: i / DOT_VARIANTS,
        ringAlpha: 0.7,
      }),
      { pixelRatio: PIXEL_RATIO }
    );
  }
  map.addImage(
    ACTIVE_DOT_IMAGE,
    createPulsingDot({
      size: 88,
      core: 10,
      color: DOT_RGB,
      coreColor: "#ffffff",
      strokeColor: DOT_HEX,
      strokeWidth: 4,
      shadow: true,
      period: 1.6,
      phase: 0,
      ringAlpha: 0.95,
      rings: 2,
    }),
    { pixelRatio: PIXEL_RATIO }
  );
  map.addImage(HOVER_RING_IMAGE, createHoverRing(40), { pixelRatio: PIXEL_RATIO });
}

export function dotVariant(uuid: string) {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) | 0;
  return Math.abs(h) % DOT_VARIANTS;
}

// Built with DOM nodes + textContent rather than an HTML string: station
// names and tags come from a public, user-contributed directory.
export function buildStationTooltip(station: Station, onTap?: () => void): HTMLElement {
  const root = document.createElement("div");
  root.className = "station-tooltip-body";

  const head = document.createElement("div");
  head.className = "station-tooltip-head";

  if (station.favicon) {
    const img = document.createElement("img");
    img.src = station.favicon;
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    img.className = "station-tooltip-icon";
    img.style.display = "none";
    img.onload = () => {
      img.style.display = "";
    };
    img.onerror = () => img.remove();
    head.appendChild(img);
  }

  const titles = document.createElement("div");
  titles.className = "station-tooltip-titles";
  const name = document.createElement("div");
  name.className = "station-tooltip-name";
  name.textContent = station.name.trim() || "Unknown station";
  titles.appendChild(name);
  if (station.country) {
    const country = document.createElement("div");
    country.className = "station-tooltip-country";
    country.textContent = station.country;
    titles.appendChild(country);
  }
  head.appendChild(titles);
  root.appendChild(head);

  const tags = station.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (tags.length) {
    const row = document.createElement("div");
    row.className = "station-tooltip-tags";
    for (const tag of tags) {
      const chip = document.createElement("span");
      chip.textContent = tag;
      row.appendChild(chip);
    }
    root.appendChild(row);
  }

  const foot = document.createElement("div");
  foot.className = "station-tooltip-foot";
  const clicks = station.clickcount ?? 0;
  const stat = document.createElement("span");
  stat.textContent = clicks > 0 ? `${clicks.toLocaleString()} listens` : "Live";
  const cta = document.createElement("span");
  cta.className = "station-tooltip-cta";
  cta.textContent = onTap ? "Tap to tune in" : "Click to tune in";
  foot.append(stat, cta);
  root.appendChild(foot);

  if (onTap) {
    root.style.cursor = "pointer";
    root.addEventListener("click", onTap);
  }
  return root;
}

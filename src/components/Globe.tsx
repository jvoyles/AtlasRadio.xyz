"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap, config as maplibreConfig, type GeoJSONSource, type MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Station } from "@/lib/radioBrowser";

// The exact free vector-tile style devglobe.app itself uses: OpenFreeMap's
// "liberty" style, backed by real OpenStreetMap data — no API key, no
// usage cap, no cost (data is ODbL, hence the small attribution control
// left enabled below rather than hidden). Real country borders, water,
// place labels, and label collision all come from this, not from any
// custom-drawn texture.
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

// MapLibre resolves its worker relative to its own `import.meta.url` at
// runtime — fine on a normal static host, but Turbopack (and most bundlers)
// serve the library's module under a content-hashed chunk path with no real
// sibling worker file next to it, so that lookup 404s. `maplibre-gl-worker.mjs`
// and its `maplibre-gl-shared.mjs` dependency are copied into public/ (see
// package.json's "postinstall") and pointed to here via the documented
// WORKER_URL override, so the worker loads from a stable, real path instead.
maplibreConfig.WORKER_URL = "/maplibre-gl-worker.mjs";

const SPIN_DEGREES_PER_SEC = 4;

type Star = { x: number; y: number; r: number; base: number; phase: number; speed: number };
type Comet = { x: number; y: number; angle: number; speed: number; len: number; life: number; maxLife: number };

function makeStars(width: number, height: number): Star[] {
  return Array.from({ length: 700 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 0.4 + Math.random() * 1.1,
    base: 0.25 + Math.random() * 0.55,
    phase: Math.random() * Math.PI * 2,
    speed: 0.4 + Math.random() * 1.6,
  }));
}

function spawnComet(width: number, height: number): Comet {
  return {
    x: Math.random() * width,
    y: Math.random() * height * 0.6,
    angle: Math.random() * Math.PI * 2,
    speed: 8 * Math.random() + 6,
    len: 200 * Math.random() + 150,
    life: 0,
    maxLife: 80 + 40 * Math.random(),
  };
}

export function Globe({
  stations,
  currentId,
  onSelect,
}: {
  stations: Station[];
  currentId?: string | null;
  onSelect: (station: Station) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const starCanvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const stationsRef = useRef(stations);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    stationsRef.current = stations;
  }, [stations]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = starCanvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    const comets: Comet[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = makeStars(width, height);
    };

    const render = (time: number, frames: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        const twinkle = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(time * 0.001 * star.speed + star.phase);
        ctx.fillStyle = `rgba(255,255,255,${star.base * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (reduceMotion) return;

      if (Math.random() > 1 - 0.001 * frames && comets.length < 1) comets.push(spawnComet(width, height));
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.life += frames;
        c.x += Math.cos(c.angle) * c.speed * frames;
        c.y += Math.sin(c.angle) * c.speed * frames;
        if (c.life >= c.maxLife) {
          comets.splice(i, 1);
          continue;
        }
        const alpha = Math.sin((c.life / c.maxLife) * Math.PI);
        const tailX = c.x - Math.cos(c.angle) * c.len;
        const tailY = c.y - Math.sin(c.angle) * c.len;
        const tail = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
        tail.addColorStop(0, `rgba(255,255,255,${0.8 * alpha})`);
        tail.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = tail;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.fillStyle = `rgba(200,220,255,${0.5 * alpha})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reduceMotion) render(0, 0);
    });
    resizeObserver.observe(container);

    let frame = 0;
    let last = performance.now();
    if (reduceMotion) {
      render(0, 0);
    } else {
      const loop = (now: number) => {
        frame = requestAnimationFrame(loop);
        const frames = Math.min((now - last) / (1000 / 60), 4);
        last = now;
        render(now, frames);
      };
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: STYLE_URL,
      center: [0, 20],
      zoom: 1.5,
      minZoom: 0.8,
      maxZoom: 10,
      pitch: 0,
      bearing: 0,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();

    map.on("load", () => {
      map.setProjection({ type: "globe" });
      // Starts empty: geo stations arrive from an async fetch that may
      // resolve before or after this "load" event fires, so the source is
      // seeded here and kept in sync by the dedicated effect below on every
      // `stations` change, rather than captured once from this closure.
      map.addSource("stations", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "stations-layer",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius": 3.5,
          "circle-color": "#ffffff",
          "circle-opacity": 0.85,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(0,0,0,0.35)",
        },
      });

      map.addSource("active-station", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "active-station-layer",
        type: "circle",
        source: "active-station",
        paint: {
          "circle-radius": 8,
          "circle-color": "#ff7a5a",
          "circle-opacity": 0.9,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", "stations-layer", (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id;
        const station = stationsRef.current.find((s) => s.stationuuid === id);
        if (station) onSelectRef.current(station);
      });
      map.on("mouseenter", "stations-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "stations-layer", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    let spinning = true;
    let idleTimeout: ReturnType<typeof setTimeout> | null = null;
    const pauseSpin = () => {
      spinning = false;
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        spinning = true;
      }, 2500);
    };
    map.on("dragstart", pauseSpin);
    map.on("wheel", pauseSpin);

    let lastTime = performance.now();
    let frame = 0;
    const spin = (now: number) => {
      frame = requestAnimationFrame(spin);
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      if (spinning) {
        const center = map.getCenter();
        map.jumpTo({ center: [center.lng + SPIN_DEGREES_PER_SEC * dt, center.lat] });
      }
    };
    frame = requestAnimationFrame(spin);

    return () => {
      cancelAnimationFrame(frame);
      if (idleTimeout) clearTimeout(idleTimeout);
      map.off("dragstart", pauseSpin);
      map.off("wheel", pauseSpin);
      map.remove();
      mapRef.current = null;
    };
    // The map itself is built once; station data is synced reactively by
    // the two effects below instead of being read from this closure.
  }, []);

  // Both the async geo-station fetch and the map's own style/tile load are
  // racing, unordered async operations, so either can finish first. Setting
  // source data only works once the source has actually been created (in
  // the "load" handler above); if that hasn't happened yet, defer via
  // `once("load", ...)` instead of silently dropping the update.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const validStations = stations.filter(
      (s) => typeof s.geo_lat === "number" && typeof s.geo_long === "number"
    );
    const stationsGeoJson: GeoJSON.FeatureCollection<GeoJSON.Point, { id: string }> = {
      type: "FeatureCollection",
      features: validStations.map((s) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [s.geo_long as number, s.geo_lat as number] },
        properties: { id: s.stationuuid },
      })),
    };
    const apply = () => (map.getSource("stations") as GeoJSONSource | undefined)?.setData(stationsGeoJson);
    if (map.getSource("stations")) apply();
    else map.once("load", apply);
  }, [stations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const station = stations.find((s) => s.stationuuid === currentId);
    const activeGeoJson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features:
        station && typeof station.geo_lat === "number" && typeof station.geo_long === "number"
          ? [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [station.geo_long, station.geo_lat] },
                properties: {},
              },
            ]
          : [],
    };
    const apply = () => (map.getSource("active-station") as GeoJSONSource | undefined)?.setData(activeGeoJson);
    if (map.getSource("active-station")) apply();
    else map.once("load", apply);
  }, [stations, currentId]);

  return (
    <div ref={containerRef} className="relative w-full h-full cursor-grab active:cursor-grabbing">
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, #0C1B33 0%, #081222 100%)" }}
      />
      <canvas ref={starCanvasRef} className="absolute inset-0 pointer-events-none" />
      {/* Inline style, not a Tailwind class: maplibre-gl.css sets
          `.maplibregl-map { position: relative }` with the same
          specificity as Tailwind's `.absolute`, and whichever rule's
          import happens to land later in the bundle wins — which
          collapsed this div to height 0 more often than not. An inline
          style always outranks any external stylesheet rule. */}
      <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}

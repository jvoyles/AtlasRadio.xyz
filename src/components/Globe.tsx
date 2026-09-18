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

function drawStarfield(canvas: HTMLCanvasElement, width: number, height: number) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const hash = (seed: number) => {
    const h = Math.sin(seed * 12.9898) * 43758.5453;
    return h - Math.floor(h);
  };
  for (let i = 0; i < 700; i++) {
    const x = hash(i * 3.1 + 1) * width;
    const y = hash(i * 5.3 + 2) * height;
    const r = 0.4 + hash(i * 7.1 + 3) * 1.1;
    ctx.fillStyle = `rgba(255,255,255,${0.25 + hash(i * 2.2) * 0.55})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
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
    const starCanvas = starCanvasRef.current;
    if (!container || !starCanvas) return;
    const draw = () => drawStarfield(starCanvas, container.clientWidth, container.clientHeight);
    draw();
    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
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
        style={{ background: "radial-gradient(rgb(12,27,51) 0%, rgb(8,18,34) 100%)" }}
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

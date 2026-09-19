"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Popup, config as maplibreConfig, type GeoJSONSource, type MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Station } from "@/lib/radioBrowser";
import {
  ACTIVE_DOT_IMAGE,
  HOVER_RING_IMAGE,
  buildStationTooltip,
  dotVariant,
  registerStationImages,
} from "@/lib/stationDots";
import { applyTerrainPalette, createAtmosphereHalo, createStarfield } from "@/lib/globeLayers";

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

const SPIN_DEGREES_PER_SEC = 3;

type Comet = { x: number; y: number; angle: number; speed: number; len: number; life: number; maxLife: number };

function spawnComet(width: number, height: number): Comet {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    angle: Math.random() * Math.PI * 2,
    speed: 8 * Math.random() + 6,
    len: 200 * Math.random() + 150,
    life: 0,
    maxLife: 80 + 40 * Math.random(),
  };
}

function initialZoom() {
  const side = Math.min(window.innerWidth, window.innerHeight);
  return side >= 768 ? 1.5 : (side / 768) * 1.1;
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d")!;
    const comets: Comet[] = [];

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let last = performance.now();
    let frame = requestAnimationFrame(function loop(now: number) {
      const frames = Math.min((now - last) / (1000 / 60), 4);
      last = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (Math.random() > 1 - 0.001 * frames && comets.length < 1) comets.push(spawnComet(canvas.width, canvas.height));
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.life += frames;
        c.x += Math.cos(c.angle) * c.speed * frames;
        c.y += Math.sin(c.angle) * c.speed * frames;
        const alpha = 1 - c.life / c.maxLife;
        if (c.life >= c.maxLife) {
          comets.splice(i, 1);
          continue;
        }
        const tailX = c.x - Math.cos(c.angle) * c.len;
        const tailY = c.y - Math.sin(c.angle) * c.len;
        const tail = ctx.createLinearGradient(tailX, tailY, c.x, c.y);
        tail.addColorStop(0, "rgba(255, 255, 255, 0)");
        tail.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);
        ctx.strokeStyle = tail;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
        ctx.fillStyle = `rgba(200, 220, 255, ${0.5 * alpha})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
      frame = requestAnimationFrame(loop);
    });

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
      center: [0, 30],
      zoom: initialZoom(),
      minZoom: 0.8,
      maxZoom: 10,
      maxPitch: 85,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();

    map.on("load", () => {
      map.setProjection({ type: "globe" });
      map.once("render", () => {
        if (mapContainerRef.current) mapContainerRef.current.style.opacity = "1";
      });
      const firstLayerId = map.getStyle().layers?.[0]?.id;
      map.addLayer(createAtmosphereHalo(), firstLayerId);
      map.addLayer(createStarfield(), "atmosphere-halo");
      applyTerrainPalette(map);
      // Starts empty: geo stations arrive from an async fetch that may
      // resolve before or after this "load" event fires, so the source is
      // seeded here and kept in sync by the dedicated effect below on every
      // `stations` change, rather than captured once from this closure.
      registerStationImages(map);

      map.addSource("hovered-station", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "hovered-station-layer",
        type: "symbol",
        source: "hovered-station",
        layout: { "icon-image": HOVER_RING_IMAGE, "icon-allow-overlap": true, "icon-ignore-placement": true },
      });

      map.addSource("stations", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "stations-layer",
        type: "symbol",
        source: "stations",
        layout: {
          "icon-image": ["concat", "station-dot-", ["to-string", ["get", "variant"]]],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });

      map.addSource("active-station", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "active-station-layer",
        type: "symbol",
        source: "active-station",
        layout: { "icon-image": ACTIVE_DOT_IMAGE, "icon-allow-overlap": true, "icon-ignore-placement": true },
      });

      map.on("click", "stations-layer", (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id;
        const station = stationsRef.current.find((s) => s.stationuuid === id);
        if (station) onSelectRef.current(station);
      });

      const tooltip = new Popup({
        className: "station-tooltip",
        closeButton: false,
        closeOnClick: false,
        closeOnMove: false,
        anchor: "bottom",
        offset: 16,
        maxWidth: "260px",
      });
      let hoveredId: string | null = null;
      const setHovered = (station: Station | null) => {
        const hoveredSource = map.getSource("hovered-station") as GeoJSONSource | undefined;
        if (!station || typeof station.geo_lat !== "number" || typeof station.geo_long !== "number") {
          hoveredId = null;
          hovering = false;
          tooltip.remove();
          hoveredSource?.setData({ type: "FeatureCollection", features: [] });
          return;
        }
        if (station.stationuuid === hoveredId) return;
        hoveredId = station.stationuuid;
        hovering = true;
        const lngLat: [number, number] = [station.geo_long, station.geo_lat];
        tooltip.setLngLat(lngLat).setDOMContent(buildStationTooltip(station)).addTo(map);
        hoveredSource?.setData({
          type: "FeatureCollection",
          features: [{ type: "Feature", geometry: { type: "Point", coordinates: lngLat }, properties: {} }],
        });
      };
      map.on("mousemove", "stations-layer", (e: MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const id = e.features?.[0]?.properties?.id;
        setHovered(stationsRef.current.find((s) => s.stationuuid === id) ?? null);
      });
      map.on("mouseleave", "stations-layer", () => {
        map.getCanvas().style.cursor = "";
        setHovered(null);
      });
      map.on("dragstart", () => setHovered(null));
    });

    let spinning = true;
    let hovering = false;
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
      if (spinning && !hovering) {
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
    const stationsGeoJson: GeoJSON.FeatureCollection<GeoJSON.Point, { id: string; variant: number }> = {
      type: "FeatureCollection",
      features: validStations.map((s) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [s.geo_long as number, s.geo_lat as number] },
        properties: { id: s.stationuuid, variant: dotVariant(s.stationuuid) },
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
      <div
        ref={mapContainerRef}
        style={{ position: "absolute", inset: 0, opacity: 0, transition: "opacity 300ms" }}
      />
    </div>
  );
}

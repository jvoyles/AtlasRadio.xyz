"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Country = { name: string; stationcount: number; iso_3166_1: string };

const TILE_W = 64;
const TILE_H = 32;
const ZOOM_STEPS = [0.5, 0.75, 1, 1.5, 2, 2.5, 3];

function hueFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function heightFor(stationcount: number) {
  return Math.min(150, 24 + Math.log2(stationcount + 1) * 18);
}

type Building = {
  country: Country;
  gx: number;
  gy: number;
  x: number;
  y: number;
  h: number;
  hue: number;
};

function layout(countries: Country[]): Building[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(countries.length)));
  return countries.map((country, i) => {
    const gx = i % cols;
    const gy = Math.floor(i / cols);
    return {
      country,
      gx,
      gy,
      x: (gx - gy) * (TILE_W / 2),
      y: (gx + gy) * (TILE_H / 2),
      h: heightFor(country.stationcount),
      hue: hueFor(country.name),
    };
  });
}

function Ground({ gx, gy }: { gx: number; gy: number }) {
  const x = (gx - gy) * (TILE_W / 2);
  const y = (gx + gy) * (TILE_H / 2);
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const light = (gx + gy) % 2 === 0;
  return (
    <polygon
      points={`${x},${y - hh} ${x + hw},${y} ${x},${y + hh} ${x - hw},${y}`}
      fill={light ? "#1f3a2e" : "#1a3226"}
    />
  );
}

function BuildingShape({
  building,
  hovered,
  onEnter,
  onLeave,
  onClick,
}: {
  building: Building;
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const { x, y, h, hue } = building;
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const topY = y - h;
  const l = hovered ? 8 : 0;
  const top = `hsl(${hue}, 85%, ${62 + l}%)`;
  const left = `hsl(${hue}, 80%, ${42 + l}%)`;
  const right = `hsl(${hue}, 80%, ${30 + l}%)`;

  return (
    <g
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      className="cursor-pointer"
    >
      <polygon
        points={`${x - hw},${y} ${x},${y + hh} ${x},${topY + hh} ${x - hw},${topY}`}
        fill={left}
      />
      <polygon
        points={`${x + hw},${y} ${x},${y + hh} ${x},${topY + hh} ${x + hw},${topY}`}
        fill={right}
      />
      <polygon
        points={`${x},${topY - hh} ${x + hw},${topY} ${x},${topY + hh} ${x - hw},${topY}`}
        fill={top}
        stroke={hovered ? "#f2e8d5" : "none"}
        strokeWidth={hovered ? 2 : 0}
      />
    </g>
  );
}

export function PixelCity({
  countries,
  onSelectCountry,
}: {
  countries: Country[];
  onSelectCountry: (name: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoomIndex, setZoomIndex] = useState(2);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const draggingRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const draggedRef = useRef(false);

  const buildings = useMemo(() => layout(countries), [countries]);

  // The layout's own center, so the skyline starts framed in the viewport;
  // `pan` (state) then tracks only the user's drag offset on top of this.
  const center = useMemo(() => {
    if (buildings.length === 0) return { x: 0, y: 0 };
    const minX = Math.min(...buildings.map((b) => b.x)) - TILE_W;
    const maxX = Math.max(...buildings.map((b) => b.x)) + TILE_W;
    const minY = Math.min(...buildings.map((b) => b.y - b.h)) - TILE_H;
    const maxY = Math.max(...buildings.map((b) => b.y)) + TILE_H;
    return { x: -(minX + maxX) / 2, y: -(minY + maxY) / 2 };
  }, [buildings]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => setSize({ width: container.clientWidth, height: container.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const zoom = ZOOM_STEPS[zoomIndex];
  const offset = { x: center.x + pan.x, y: center.y + pan.y };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomIndex((i) => {
        const next = e.deltaY > 0 ? i - 1 : i + 1;
        return Math.max(0, Math.min(ZOOM_STEPS.length - 1, next));
      });
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    draggedRef.current = false;
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    const drag = draggingRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 4) draggedRef.current = true;
    setPan({ x: drag.panX + dx / zoom, y: drag.panY + dy / zoom });
  };
  const handlePointerUp = () => {
    draggingRef.current = null;
  };

  const hovered = buildings.find((b) => b.country.name === hoveredKey) ?? null;

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {size.width > 0 && (
        <svg
          width={size.width}
          height={size.height}
          shapeRendering="crispEdges"
          className="block"
        >
          <rect width={size.width} height={size.height} fill="#0f2018" />
          <g
            transform={`translate(${size.width / 2 + offset.x * zoom},${size.height / 2 + offset.y * zoom}) scale(${zoom})`}
          >
            {buildings.map((b) => (
              <Ground key={`ground-${b.country.name}`} gx={b.gx} gy={b.gy} />
            ))}
            {buildings.map((b) => (
              <BuildingShape
                key={b.country.name}
                building={b}
                hovered={hoveredKey === b.country.name}
                onEnter={() => setHoveredKey(b.country.name)}
                onLeave={() => setHoveredKey((k) => (k === b.country.name ? null : k))}
                onClick={() => {
                  if (!draggedRef.current) onSelectCountry(b.country.name);
                }}
              />
            ))}
          </g>
        </svg>
      )}

      {hovered && pointer && (
        <div
          className="pointer-events-none absolute z-10 px-2.5 py-1.5 bg-paper border-2 border-ink text-ink"
          style={{ left: pointer.x + 14, top: pointer.y - 8 }}
        >
          <p className="text-xs font-bold leading-tight">{hovered.country.name}</p>
          <p className="text-[11px] text-ink-muted tabular-nums leading-tight">
            {hovered.country.stationcount.toLocaleString()} stations
          </p>
        </div>
      )}
    </div>
  );
}

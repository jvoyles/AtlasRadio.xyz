"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Station } from "@/lib/radioBrowser";

const RADIUS = 1;

function latLongToVector3(lat: number, lon: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function makeNoise3() {
  const hash3 = (x: number, y: number, z: number) => {
    const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
    return h - Math.floor(h);
  };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  return function noise3(x: number, y: number, z: number) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const w = zf * zf * (3 - 2 * zf);
    const c000 = hash3(xi, yi, zi), c100 = hash3(xi + 1, yi, zi);
    const c010 = hash3(xi, yi + 1, zi), c110 = hash3(xi + 1, yi + 1, zi);
    const c001 = hash3(xi, yi, zi + 1), c101 = hash3(xi + 1, yi, zi + 1);
    const c011 = hash3(xi, yi + 1, zi + 1), c111 = hash3(xi + 1, yi + 1, zi + 1);
    const x00 = lerp(c000, c100, u), x10 = lerp(c010, c110, u);
    const x01 = lerp(c001, c101, u), x11 = lerp(c011, c111, u);
    const y0 = lerp(x00, x10, v), y1 = lerp(x01, x11, v);
    return lerp(y0, y1, w);
  };
}

function fbm(
  noise3: (x: number, y: number, z: number) => number,
  x: number,
  y: number,
  z: number,
  octaves: number
) {
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

// Generates a seamless equirectangular night-earth texture for the core
// sphere: fractal noise sampled on (cos theta, sin theta, lat) so it wraps
// cleanly at the longitude seam, gives a faint charcoal silhouette to land
// against pure-black ocean, then scatters warm glowing city-light dots over
// that land — the "network of signals at night" read of a real night-earth
// image, never a filled, map-like landmass.
function createGlobeTexture() {
  const W = 768;
  const H = 384;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(W, H);
  const data = image.data;
  const noise3 = makeNoise3();

  const OCEAN = [3, 5, 10];
  const LAND_SILHOUETTE = [13, 15, 22];

  const land = new Uint8Array(W * H);

  for (let py = 0; py < H; py++) {
    const v = py / H;
    const latNorm = v * 2 - 1;
    for (let px = 0; px < W; px++) {
      const u = px / W;
      const theta = u * Math.PI * 2;
      const nx = Math.cos(theta) * 3.4;
      const nz = Math.sin(theta) * 3.4;
      const ny = latNorm * 3.4;
      let n = fbm(noise3, nx, nz, ny, 5);
      n -= Math.abs(latNorm) * 0.2;
      land[py * W + px] = n > 0.58 ? 1 : 0;
    }
  }

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const idx = py * W + px;
      const i4 = idx * 4;
      const [r, g, b] = land[idx] === 1 ? LAND_SILHOUETTE : OCEAN;
      data[i4] = r;
      data[i4 + 1] = g;
      data[i4 + 2] = b;
      data[i4 + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  // City-light glow: sparse, dense-over-hubs dots scattered only on land,
  // drawn as soft radial blooms rather than filled shapes.
  const rand = (seed: number) => {
    const h = Math.sin(seed * 12.9898) * 43758.5453;
    return h - Math.floor(h);
  };
  ctx.globalCompositeOperation = "lighter";
  let seed = 1;
  for (let py = 0; py < H; py += 2) {
    for (let px = 0; px < W; px += 2) {
      if (land[py * W + px] !== 1) continue;
      seed += 1;
      const roll = rand(seed);
      if (roll > 0.09) continue;
      const isHub = roll < 0.012;
      const radius = isHub ? 2.2 + rand(seed * 3.1) * 1.6 : 0.6 + rand(seed * 5.7) * 0.7;
      const warmth = rand(seed * 7.3);
      const color = isHub
        ? `rgba(255,${230 + Math.floor(warmth * 20)},200,${0.5 + warmth * 0.3})`
        : `rgba(255,${200 + Math.floor(warmth * 40)},150,${0.18 + warmth * 0.22})`;
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, "rgba(255,200,140,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

// Generates a soft nebula backdrop: overlapping violet/indigo/rose cloud
// blooms on near-black, painted once and worn by a large backside sphere
// behind the starfield — the deep-space void the reference sits the planet
// in, instead of flat black.
function createNebulaTexture() {
  const W = 512;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#03040a";
  ctx.fillRect(0, 0, W, H);

  const rand = (seed: number) => {
    const h = Math.sin(seed * 78.233) * 43758.5453;
    return h - Math.floor(h);
  };
  const blooms: Array<[number, string]> = [
    [0.42, "rgba(88,58,140,0.5)"],
    [0.34, "rgba(140,60,120,0.4)"],
    [0.3, "rgba(50,70,150,0.4)"],
    [0.22, "rgba(170,90,140,0.3)"],
  ];
  ctx.globalCompositeOperation = "lighter";
  blooms.forEach(([sizeFrac, color], i) => {
    const cx = rand(i * 3 + 1) * W;
    const cy = rand(i * 5 + 2) * H;
    const r = sizeFrac * W;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(3,4,10,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  });
  ctx.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function glowSprite(color: string) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.4, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
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
  const onSelectRef = useRef(onSelect);
  const currentIdRef = useRef(currentId);
  const stampStartRef = useRef(0);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    currentIdRef.current = currentId;
    stampStartRef.current = performance.now();
  }, [currentId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.3, 2.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = 4.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.5;

    let idleRotate = true;
    let idleTimeout: ReturnType<typeof setTimeout> | null = null;
    const wakeFromIdle = () => {
      idleRotate = false;
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        idleRotate = true;
      }, 2500);
    };
    controls.addEventListener("start", wakeFromIdle);

    // Core sphere: a night-earth world — continents legible only as scattered
    // city-light glow against a black ocean, no filled landmass, no grid.
    const globeTexture = createGlobeTexture();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 0.985, 64, 64),
      new THREE.MeshBasicMaterial({ map: globeTexture })
    );
    scene.add(core);

    // A cool blue-white atmospheric rim light along the limb.
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.06, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x8fc7ff,
        transparent: true,
        opacity: 0.09,
        side: THREE.BackSide,
      })
    );
    scene.add(atmosphere);

    // A soft nebula backdrop behind the starfield, instead of flat black void.
    const nebulaTexture = createNebulaTexture();
    const nebula = new THREE.Mesh(
      new THREE.SphereGeometry(30, 24, 24),
      new THREE.MeshBasicMaterial({ map: nebulaTexture, side: THREE.BackSide, fog: false })
    );
    scene.add(nebula);

    // Starfield, mixed white and violet flecks drifting in the void.
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1600;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 8 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 0.02,
      map: glowSprite("rgba(226,220,255,1)"),
      transparent: true,
      depthWrite: false,
      opacity: 0.7,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    const starGeometry2 = new THREE.BufferGeometry();
    const starCount2 = 500;
    const starPositions2 = new Float32Array(starCount2 * 3);
    for (let i = 0; i < starCount2; i++) {
      const r = 8 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions2[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions2[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions2[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeometry2.setAttribute("position", new THREE.BufferAttribute(starPositions2, 3));
    const starMaterial2 = new THREE.PointsMaterial({
      size: 0.028,
      map: glowSprite("rgba(196,150,255,1)"),
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    });
    const stars2 = new THREE.Points(starGeometry2, starMaterial2);
    scene.add(stars2);

    // Station pins.
    const validStations = stations.filter(
      (s) => typeof s.geo_lat === "number" && typeof s.geo_long === "number"
    );
    const pinGeometry = new THREE.BufferGeometry();
    const pinPositions = new Float32Array(validStations.length * 3);
    validStations.forEach((s, i) => {
      const v = latLongToVector3(s.geo_lat as number, s.geo_long as number, RADIUS * 1.01);
      pinPositions[i * 3] = v.x;
      pinPositions[i * 3 + 1] = v.y;
      pinPositions[i * 3 + 2] = v.z;
    });
    pinGeometry.setAttribute("position", new THREE.BufferAttribute(pinPositions, 3));
    const pinMaterial = new THREE.PointsMaterial({
      size: 0.03,
      map: glowSprite("rgba(255,64,48,1)"),
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const pins = new THREE.Points(pinGeometry, pinMaterial);
    scene.add(pins);

    // The currently-playing pin: a larger red glow, pulsing up with a
    // one-shot settle whenever the active station changes.
    const activeGeometry = new THREE.BufferGeometry();
    activeGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    const activeMaterial = new THREE.PointsMaterial({
      size: 0.08,
      map: glowSprite("rgba(255,90,70,1)"),
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const activePin = new THREE.Points(activeGeometry, activeMaterial);
    activePin.visible = false;
    scene.add(activePin);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.045;
    const pointer = new THREE.Vector2();
    let pointerDownAt: { x: number; y: number } | null = null;

    const setSize = () => {
      const { clientWidth, clientHeight } = container;
      if (!clientWidth || !clientHeight) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    setSize();
    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(container);

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownAt = { x: e.clientX, y: e.clientY };
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (!pointerDownAt) return;
      const dx = e.clientX - pointerDownAt.x;
      const dy = e.clientY - pointerDownAt.y;
      pointerDownAt = null;
      if (Math.hypot(dx, dy) > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(pins);
      if (hits.length > 0 && hits[0].index !== undefined) {
        const station = validStations[hits[0].index];
        if (station) onSelectRef.current(station);
      }
    };
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);

      const activeStation = validStations.find((s) => s.stationuuid === currentIdRef.current);
      if (activeStation && typeof activeStation.geo_lat === "number" && typeof activeStation.geo_long === "number") {
        const v = latLongToVector3(activeStation.geo_lat, activeStation.geo_long, RADIUS * 1.02);
        const posAttr = activeGeometry.getAttribute("position") as THREE.BufferAttribute;
        posAttr.setXYZ(0, v.x, v.y, v.z);
        posAttr.needsUpdate = true;
        activePin.visible = true;

        // A seal stamping down: starts oversized, overshoots slightly past
        // resting size, then settles — a one-shot press, not a loop.
        const settleDuration = 0.5;
        const elapsed = (performance.now() - stampStartRef.current) / 1000;
        const p = Math.min(elapsed / settleDuration, 1);
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const easeOutBack = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
        const scale = p >= 1 ? 1 : 1.9 - 0.9 * easeOutBack;
        activeMaterial.size = 0.08 * scale;
      } else {
        activePin.visible = false;
      }

      if (idleRotate) {
        core.rotation.y += 0.0009;
        atmosphere.rotation.y += 0.0009;
        pins.rotation.y += 0.0009;
        activePin.rotation.y += 0.0009;
      }
      stars.rotation.y += 0.00006;
      stars2.rotation.y -= 0.00004;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      controls.removeEventListener("start", wakeFromIdle);
      if (idleTimeout) clearTimeout(idleTimeout);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      controls.dispose();
      renderer.dispose();
      core.geometry.dispose();
      (core.material as THREE.MeshBasicMaterial).dispose();
      globeTexture.dispose();
      atmosphere.geometry.dispose();
      (atmosphere.material as THREE.MeshBasicMaterial).dispose();
      nebula.geometry.dispose();
      (nebula.material as THREE.MeshBasicMaterial).dispose();
      nebulaTexture.dispose();
      starGeometry.dispose();
      starGeometry2.dispose();
      pinGeometry.dispose();
      activeGeometry.dispose();
      container.removeChild(renderer.domElement);
    };
    // Rebuilding the whole scene when `stations` changes is fine here: it
    // only changes once, from empty to populated, right after the initial
    // geo-station fetch resolves.
  }, [stations]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}

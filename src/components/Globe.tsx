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

function rand(seed: number) {
  const h = Math.sin(seed * 12.9898) * 43758.5453;
  return h - Math.floor(h);
}

// Generates a seamless equirectangular star-chart texture for the core
// sphere: a flat navy chart ground scattered with small chalk-white
// backdrop stars and a handful of thin constellation guide-lines — the
// sphere reads as sky, not earth. No landmass, no ocean, no grid.
function createGlobeTexture() {
  const W = 768;
  const H = 384;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0c1430";
  ctx.fillRect(0, 0, W, H);
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H * 0.75);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(4,7,20,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // Backdrop stars: decorative, non-interactive chalk pinpricks.
  const backdrop: Array<[number, number]> = [];
  for (let i = 0; i < 900; i++) {
    const px = rand(i * 3.1 + 1) * W;
    const py = rand(i * 5.7 + 2) * H;
    backdrop.push([px, py]);
    const r = 0.4 + rand(i * 7.9 + 3) * 0.7;
    ctx.fillStyle = `rgba(226,230,245,${0.25 + rand(i * 11.3 + 4) * 0.45})`;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // A handful of faint constellation guide-lines connecting nearby stars.
  ctx.strokeStyle = "rgba(180,190,220,0.14)";
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 26; i++) {
    const a = backdrop[Math.floor(rand(i * 13.1 + 9) * backdrop.length)];
    const b = backdrop[Math.floor(rand(i * 17.3 + 10) * backdrop.length)];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 90) continue;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

// A faint coordinate grid — a star chart's RA/Dec lines — as a separate
// wireframe overlay rather than baked into the chart texture.
function createGraticule() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.001, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0x8ea0d0,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    })
  );
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

// A soft ring sprite, always facing the camera — the astronomer's
// night-vision-red mark around the object currently under the eye.
function ringSprite(color: string) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2);
  ctx.stroke();
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

    // Core sphere: a navy star chart, not a map — no land, no ocean.
    const globeTexture = createGlobeTexture();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 0.985, 64, 64),
      new THREE.MeshBasicMaterial({ map: globeTexture })
    );
    scene.add(core);

    // The chart's own faint RA/Dec coordinate lines.
    const graticule = createGraticule();
    scene.add(graticule);

    // A dim red-flashlight rim, the astronomer's own reading light.
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.06, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x8a3a28,
        transparent: true,
        opacity: 0.07,
        side: THREE.BackSide,
      })
    );
    scene.add(atmosphere);

    // Starfield in the void, drifting slowly like sidereal motion.
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
      map: glowSprite("rgba(226,230,245,1)"),
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Station pins: the chart's real stars, sized by real listener
    // clickcount — a true magnitude ramp, busiest stations brightest.
    const validStations = stations.filter(
      (s) => typeof s.geo_lat === "number" && typeof s.geo_long === "number"
    );
    const counts = validStations.map((s) => s.clickcount ?? 0).sort((a, b) => a - b);
    const percentile = (p: number) => counts[Math.floor(counts.length * p)] ?? 0;
    const brightCut = percentile(0.9);
    const mediumCut = percentile(0.6);

    const tiers: Array<{ size: number; opacity: number; stations: Station[] }> = [
      { size: 0.05, opacity: 1, stations: [] },
      { size: 0.03, opacity: 0.85, stations: [] },
      { size: 0.017, opacity: 0.6, stations: [] },
    ];
    validStations.forEach((s) => {
      const c = s.clickcount ?? 0;
      if (c >= brightCut) tiers[0].stations.push(s);
      else if (c >= mediumCut) tiers[1].stations.push(s);
      else tiers[2].stations.push(s);
    });

    const pinGroups = tiers.map((tier) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(tier.stations.length * 3);
      tier.stations.forEach((s, i) => {
        const v = latLongToVector3(s.geo_lat as number, s.geo_long as number, RADIUS * 1.01);
        positions[i * 3] = v.x;
        positions[i * 3 + 1] = v.y;
        positions[i * 3 + 2] = v.z;
      });
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        size: tier.size,
        map: glowSprite("rgba(240,240,235,1)"),
        transparent: true,
        depthWrite: false,
        opacity: tier.opacity,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);
      return { points, geometry, stations: tier.stations };
    });
    const allPinGroups = [...pinGroups[0].stations, ...pinGroups[1].stations, ...pinGroups[2].stations];

    // The tuned-in station: a steady red night-vision ring, not a pulse —
    // settles once when the active station changes, then holds.
    const ringTexture = ringSprite("rgba(196,58,44,1)");
    const activeRing = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: ringTexture, transparent: true, depthWrite: false, depthTest: false })
    );
    activeRing.scale.set(0.13, 0.13, 1);
    activeRing.visible = false;
    activeRing.renderOrder = 10;
    scene.add(activeRing);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.05;
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

      for (const group of pinGroups) {
        const hits = raycaster.intersectObject(group.points);
        if (hits.length > 0 && hits[0].index !== undefined) {
          const station = group.stations[hits[0].index];
          if (station) {
            onSelectRef.current(station);
            return;
          }
        }
      }
    };
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);

      const activeStation = allPinGroups.find((s) => s.stationuuid === currentIdRef.current);
      if (activeStation && typeof activeStation.geo_lat === "number" && typeof activeStation.geo_long === "number") {
        const v = latLongToVector3(activeStation.geo_lat, activeStation.geo_long, RADIUS * 1.03);
        activeRing.position.copy(v);
        activeRing.visible = true;

        // A ring settling once onto the star it marks: starts oversized,
        // overshoots slightly, then holds steady — never a continuous pulse.
        const settleDuration = 0.5;
        const elapsed = (performance.now() - stampStartRef.current) / 1000;
        const p = Math.min(elapsed / settleDuration, 1);
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const easeOutBack = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
        const scale = p >= 1 ? 1 : 1.9 - 0.9 * easeOutBack;
        activeRing.scale.set(0.13 * scale, 0.13 * scale, 1);
      } else {
        activeRing.visible = false;
      }

      if (idleRotate) {
        core.rotation.y += 0.0009;
        graticule.rotation.y += 0.0009;
        atmosphere.rotation.y += 0.0009;
        pinGroups.forEach((group) => (group.points.rotation.y += 0.0009));
      }
      stars.rotation.y += 0.00006;

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
      graticule.geometry.dispose();
      (graticule.material as THREE.MeshBasicMaterial).dispose();
      atmosphere.geometry.dispose();
      (atmosphere.material as THREE.MeshBasicMaterial).dispose();
      starGeometry.dispose();
      pinGroups.forEach((group) => {
        group.geometry.dispose();
        (group.points.material as THREE.PointsMaterial).dispose();
      });
      ringTexture.dispose();
      container.removeChild(renderer.domElement);
    };
    // Rebuilding the whole scene when `stations` changes is fine here: it
    // only changes once, from empty to populated, right after the initial
    // geo-station fetch resolves.
  }, [stations]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}

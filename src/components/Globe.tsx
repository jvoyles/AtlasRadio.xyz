"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Station } from "@/lib/radioBrowser";
import countryData from "@/data/countries.json";

type CountryFeature = {
  name: string;
  rings: number[][][][];
  label: [number, number];
  area: number;
};

const countries = countryData as CountryFeature[];
const RADIUS = 1;
const TEX_W = 2048;
const TEX_H = 1024;
const LABEL_COUNT = 60;

function latLongToVector3(lat: number, lon: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function hash(seed: number) {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

function lonLatToXY(lon: number, lat: number) {
  return [((lon + 180) / 360) * TEX_W, ((90 - lat) / 180) * TEX_H];
}

// Renders the real Natural Earth country boundaries (via world-atlas) as
// an equirectangular map: vivid flat ocean/land fills with dark borders,
// matching a vector political-globe look rather than a photographic one.
// Each ring is drawn three times (shifted -W/0/+W) since it may have been
// unwrapped past +-180 degrees crossing the antimeridian (see
// scripts/build-country-data.cjs), so it must reappear on both edges.
function createGlobeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#1f6fbf";
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    const hue = 108 + hash(i * 3.7 + 1) * 14 - 7;
    const light = 34 + hash(i * 5.1 + 2) * 8;
    ctx.fillStyle = `hsl(${hue}, 38%, ${light}%)`;

    for (const shift of [-TEX_W, 0, TEX_W]) {
      ctx.beginPath();
      for (const poly of country.rings) {
        for (const ring of poly) {
          ring.forEach(([lon, lat], idx) => {
            const [x, y] = lonLatToXY(lon, lat);
            if (idx === 0) ctx.moveTo(x + shift, y);
            else ctx.lineTo(x + shift, y);
          });
          ctx.closePath();
        }
      }
      ctx.fill();
    }
  }

  ctx.strokeStyle = "rgba(10,16,26,0.55)";
  ctx.lineWidth = 1.1;
  for (const country of countries) {
    for (const shift of [-TEX_W, 0, TEX_W]) {
      ctx.beginPath();
      for (const poly of country.rings) {
        for (const ring of poly) {
          ring.forEach(([lon, lat], idx) => {
            const [x, y] = lonLatToXY(lon, lat);
            if (idx === 0) ctx.moveTo(x + shift, y);
            else ctx.lineTo(x + shift, y);
          });
        }
      }
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeLabelSprite(text: string) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = "600 40px Inter, sans-serif";
  const width = Math.ceil(ctx.measureText(text).width) + 24;
  canvas.width = width;
  canvas.height = 56;
  ctx.font = "600 40px Inter, sans-serif";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(6,10,18,0.85)";
  ctx.strokeText(text, 12, 30);
  ctx.fillStyle = "#eef3f9";
  ctx.fillText(text, 12, 30);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  const scale = 0.09;
  sprite.scale.set((width / canvas.height) * scale, scale, 1);
  return { sprite, texture, material };
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

// A halo sprite is centered on the globe, not on the rim itself, so a
// bright-at-center gradient (the point-light look `glowSprite` makes)
// would wash out the entire visible disc and every label on it. This one
// stays transparent through the globe's own footprint and only blooms in
// a ring right at and beyond `edgeFrac` (the globe's radius as a fraction
// of the sprite's own half-width, given its THREE.Sprite scale).
function haloRingSprite(color: string, edgeFrac: number) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(Math.max(0, edgeFrac - 0.03), "rgba(0,0,0,0)");
  gradient.addColorStop(edgeFrac + 0.02, color);
  gradient.addColorStop(edgeFrac + 0.16, "rgba(190,225,255,0.25)");
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
    camera.position.set(0, 0.2, 2.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 1.7;
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

    // Everything that spins together lives in one rotating group, so
    // labels (sprites, which always face the camera regardless of parent
    // rotation) still travel around with the globe correctly.
    const spin = new THREE.Group();
    scene.add(spin);

    const globeTexture = createGlobeTexture();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 96, 96),
      new THREE.MeshPhongMaterial({ map: globeTexture, shininess: 10, specular: new THREE.Color(0x5f89b8) })
    );
    spin.add(core);

    const ambient = new THREE.AmbientLight(0x8fa8c8, 0.6);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff6e6, 1.9);
    sun.position.set(4, 2, 3);
    scene.add(sun);

    // A strong glowing halo right at the limb, closer to the reference's
    // bloom than a subtle rim — transparent over the globe's own disc
    // (haloRingSprite's edgeFrac matches the scale below) so it never
    // washes out the globe's surface or its labels, plus a brighter thin
    // backside shell for the sharp edge.
    const haloScale = 3.0;
    const haloTexture = haloRingSprite("rgba(210,232,255,0.9)", RADIUS / (haloScale / 2));
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: haloTexture,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    halo.scale.set(haloScale, haloScale, 1);
    scene.add(halo);

    const rim = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.015, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0xbfe0ff,
        transparent: true,
        opacity: 0.35,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      })
    );
    spin.add(rim);

    // Distant starfield.
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 8 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 0.02,
      map: glowSprite("rgba(255,255,255,1)"),
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Country name labels for the largest countries, always facing the
    // camera; hidden per-frame once their point rotates onto the far side.
    const topCountries = [...countries].sort((a, b) => b.area - a.area).slice(0, LABEL_COUNT);
    const labelResources: THREE.CanvasTexture[] = [];
    const labels = topCountries.map((c) => {
      const { sprite, texture } = makeLabelSprite(c.name);
      labelResources.push(texture);
      const pos = latLongToVector3(c.label[1], c.label[0], RADIUS * 1.03);
      sprite.position.copy(pos);
      spin.add(sprite);
      return { sprite, normal: pos.clone().normalize() };
    });

    // Station pins.
    const validStations = stations.filter(
      (s) => typeof s.geo_lat === "number" && typeof s.geo_long === "number"
    );
    const pinGeometry = new THREE.BufferGeometry();
    const pinPositions = new Float32Array(validStations.length * 3);
    validStations.forEach((s, i) => {
      const v = latLongToVector3(s.geo_lat as number, s.geo_long as number, RADIUS * 1.015);
      pinPositions[i * 3] = v.x;
      pinPositions[i * 3 + 1] = v.y;
      pinPositions[i * 3 + 2] = v.z;
    });
    pinGeometry.setAttribute("position", new THREE.BufferAttribute(pinPositions, 3));
    const pinMaterial = new THREE.PointsMaterial({
      size: 0.03,
      map: glowSprite("rgba(255,255,255,1)"),
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const pins = new THREE.Points(pinGeometry, pinMaterial);
    spin.add(pins);

    const activeGeometry = new THREE.BufferGeometry();
    activeGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    const activeMaterial = new THREE.PointsMaterial({
      size: 0.085,
      map: glowSprite("rgba(255,120,90,1)"),
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const activePin = new THREE.Points(activeGeometry, activeMaterial);
    activePin.visible = false;
    spin.add(activePin);

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

    const camDir = new THREE.Vector3();
    const worldNormal = new THREE.Vector3();
    const worldPos = new THREE.Vector3();
    const screenPos = new THREE.Vector3();
    const placed: { x: number; y: number; w: number; h: number }[] = [];

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

        const settleDuration = 0.5;
        const elapsed = (performance.now() - stampStartRef.current) / 1000;
        const p = Math.min(elapsed / settleDuration, 1);
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const easeOutBack = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
        const scale = p >= 1 ? 1 : 1.9 - 0.9 * easeOutBack;
        activeMaterial.size = 0.085 * scale;
      } else {
        activePin.visible = false;
      }

      if (idleRotate) spin.rotation.y += 0.0009;
      stars.rotation.y += 0.00006;

      // Labels declutter each frame in priority order (largest country
      // first, matching `labels`'s pre-sorted order): a label only shows
      // if it isn't a near-hemisphere edge case and doesn't overlap a
      // higher-priority label already placed on screen this frame — real
      // map labels never stack on top of each other like raw hemisphere
      // culling alone allows.
      camDir.copy(camera.position).normalize();
      placed.length = 0;
      const w = container.clientWidth;
      const h = container.clientHeight;
      for (const { sprite, normal } of labels) {
        worldNormal.copy(normal).applyAxisAngle(new THREE.Vector3(0, 1, 0), spin.rotation.y);
        if (worldNormal.dot(camDir) <= 0.2) {
          sprite.visible = false;
          continue;
        }
        worldPos.copy(sprite.position).applyAxisAngle(new THREE.Vector3(0, 1, 0), spin.rotation.y);
        screenPos.copy(worldPos).project(camera);
        const px = ((screenPos.x + 1) / 2) * w;
        const py = ((1 - screenPos.y) / 2) * h;
        const boxW = sprite.scale.x * 160;
        const boxH = sprite.scale.y * 160;
        const overlaps = placed.some(
          (p) => Math.abs(p.x - px) < (p.w + boxW) / 2 && Math.abs(p.y - py) < (p.h + boxH) / 2
        );
        sprite.visible = !overlaps;
        if (!overlaps) placed.push({ x: px, y: py, w: boxW, h: boxH });
      }

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
      (core.material as THREE.MeshPhongMaterial).dispose();
      globeTexture.dispose();
      rim.geometry.dispose();
      (rim.material as THREE.MeshBasicMaterial).dispose();
      halo.material.dispose();
      haloTexture.dispose();
      starGeometry.dispose();
      pinGeometry.dispose();
      activeGeometry.dispose();
      labels.forEach(({ sprite }) => sprite.material.dispose());
      labelResources.forEach((t) => t.dispose());
      container.removeChild(renderer.domElement);
    };
    // Rebuilding the whole scene when `stations` changes is fine here: it
    // only changes once, from empty to populated, right after the initial
    // geo-station fetch resolves.
  }, [stations]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}

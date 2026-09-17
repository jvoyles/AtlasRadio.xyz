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

// Recolors the real NASA Blue Marble texture's dark navy ocean into the
// vivid, saturated blue of a classic desktop relief globe, while leaving
// the real coastlines and land colors (lightly punched up) untouched.
function loadVividEarthTexture(onReady: (texture: THREE.CanvasTexture) => void) {
  const img = new Image();
  img.src = "/textures/earth-daymap.png";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = r * 0.3 + g * 0.59 + b * 0.11;
      const isOcean = b > r * 1.1 && b > g * 0.95 && luma < 130;
      if (isOcean) {
        const t = Math.min(1, luma / 90);
        data[i] = 15 + t * 45;
        data[i + 1] = 95 + t * 70;
        data[i + 2] = 165 + t * 55;
      } else {
        data[i] = Math.min(255, r * 1.05);
        data[i + 1] = Math.min(255, g * 1.12);
        data[i + 2] = b * 0.98;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    onReady(texture);
  };
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

export function RealisticGlobe({
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

    // A soft, cool ambient fill so the night side is dim, never pitch black.
    const ambient = new THREE.AmbientLight(0xbcd4e6, 0.55);
    scene.add(ambient);

    // The "sun": one strong directional light, angled off-axis so a real
    // day/night terminator sweeps across the sphere as it rotates.
    const sun = new THREE.DirectionalLight(0xfff3e0, 2.2);
    sun.position.set(4, 2, 3);
    scene.add(sun);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 96, 96),
      new THREE.MeshPhongMaterial({
        color: 0x1e5a8a,
        shininess: 12,
        specular: new THREE.Color(0x6a8fae),
      })
    );
    scene.add(core);

    let earthTexture: THREE.CanvasTexture | null = null;
    let disposed = false;
    loadVividEarthTexture((texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      earthTexture = texture;
      const material = core.material as THREE.MeshPhongMaterial;
      material.map = texture;
      material.color.set(0xffffff);
      material.needsUpdate = true;
    });

    // A soft blue atmospheric rim halo along the limb.
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.03, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0x6fa8dc,
        transparent: true,
        opacity: 0.18,
        side: THREE.BackSide,
      })
    );
    scene.add(atmosphere);

    // Station pins.
    const validStations = stations.filter(
      (s) => typeof s.geo_lat === "number" && typeof s.geo_long === "number"
    );
    const pinGeometry = new THREE.BufferGeometry();
    const pinPositions = new Float32Array(validStations.length * 3);
    validStations.forEach((s, i) => {
      const v = latLongToVector3(s.geo_lat as number, s.geo_long as number, RADIUS * 1.012);
      pinPositions[i * 3] = v.x;
      pinPositions[i * 3 + 1] = v.y;
      pinPositions[i * 3 + 2] = v.z;
    });
    pinGeometry.setAttribute("position", new THREE.BufferAttribute(pinPositions, 3));
    const pinMaterial = new THREE.PointsMaterial({
      size: 0.035,
      map: glowSprite("rgba(214,58,40,1)"),
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const pins = new THREE.Points(pinGeometry, pinMaterial);
    scene.add(pins);

    // The currently-playing pin: a larger flare, pressed in with a one-shot
    // settle whenever the active station changes.
    const activeGeometry = new THREE.BufferGeometry();
    activeGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    const activeMaterial = new THREE.PointsMaterial({
      size: 0.09,
      map: glowSprite("rgba(255,140,60,1)"),
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

        const settleDuration = 0.5;
        const elapsed = (performance.now() - stampStartRef.current) / 1000;
        const p = Math.min(elapsed / settleDuration, 1);
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const easeOutBack = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
        const scale = p >= 1 ? 1 : 1.9 - 0.9 * easeOutBack;
        activeMaterial.size = 0.09 * scale;
      } else {
        activePin.visible = false;
      }

      if (idleRotate) {
        core.rotation.y += 0.0009;
        atmosphere.rotation.y += 0.0009;
        pins.rotation.y += 0.0009;
        activePin.rotation.y += 0.0009;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
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
      earthTexture?.dispose();
      atmosphere.geometry.dispose();
      (atmosphere.material as THREE.MeshBasicMaterial).dispose();
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

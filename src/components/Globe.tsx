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

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    currentIdRef.current = currentId;
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

    // Core sphere: a dark planet with a glowing lat/long wireframe.
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 0.985, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x05040c, transparent: true, opacity: 0.92 })
    );
    scene.add(core);

    const wireframe = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 40, 24),
      new THREE.MeshBasicMaterial({
        color: 0x2fe6c8,
        wireframe: true,
        transparent: true,
        opacity: 0.14,
      })
    );
    scene.add(wireframe);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.08, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff5cf0,
        transparent: true,
        opacity: 0.06,
        side: THREE.BackSide,
      })
    );
    scene.add(atmosphere);

    // Starfield.
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1400;
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
      map: glowSprite("rgba(238,242,255,1)"),
      transparent: true,
      depthWrite: false,
      opacity: 0.7,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

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
      size: 0.035,
      map: glowSprite("rgba(47,230,200,1)"),
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const pins = new THREE.Points(pinGeometry, pinMaterial);
    scene.add(pins);

    // The currently-playing pin, rendered separately so it can glow and pulse.
    const activeGeometry = new THREE.BufferGeometry();
    activeGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    const activeMaterial = new THREE.PointsMaterial({
      size: 0.09,
      map: glowSprite("rgba(255,92,240,1)"),
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

    const clock = new THREE.Clock();
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      const activeStation = validStations.find((s) => s.stationuuid === currentIdRef.current);
      if (activeStation && typeof activeStation.geo_lat === "number" && typeof activeStation.geo_long === "number") {
        const v = latLongToVector3(activeStation.geo_lat, activeStation.geo_long, RADIUS * 1.02);
        const posAttr = activeGeometry.getAttribute("position") as THREE.BufferAttribute;
        posAttr.setXYZ(0, v.x, v.y, v.z);
        posAttr.needsUpdate = true;
        activePin.visible = true;
        activeMaterial.size = 0.07 + Math.sin(t * 3) * 0.02;
      } else {
        activePin.visible = false;
      }

      if (idleRotate) {
        wireframe.rotation.y += 0.0009;
        core.rotation.y += 0.0009;
        pins.rotation.y += 0.0009;
        activePin.rotation.y += 0.0009;
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
      starGeometry.dispose();
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

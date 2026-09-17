"use client";

import { useEffect, useRef } from "react";

const BARS = 4;
const PHASES = [0.4, 2.6, 4.1, 5.5];

export function EqualizerBars({ className = "", color }: { className?: string; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const gap = 2;
    const barWidth = (width - gap * (BARS - 1)) / BARS;
    let frame: number;
    let t = 0;

    const render = () => {
      t += 0.06;
      ctx.clearRect(0, 0, width, height);
      const fill =
        color ||
        `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--hue1") || 262} 82% 65%)`;

      PHASES.forEach((phase, i) => {
        const level = 0.25 + 0.75 * Math.abs(Math.sin(t * 2.2 + phase));
        const barHeight = Math.max(2, level * height);
        const x = i * (barWidth + gap);
        const y = height - barHeight;
        const radius = barWidth / 2;

        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      });

      frame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frame);
  }, [color]);

  return <canvas ref={canvasRef} className={`w-4 h-3.5 ${className}`} aria-hidden />;
}

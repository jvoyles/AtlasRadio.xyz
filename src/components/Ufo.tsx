"use client";

import { useEffect, useRef } from "react";

const MIN_DELAY_S = 120;
const MAX_DELAY_S = 300;
const LIGHT_COLORS = ["#ff6a2b", "#7dffb0", "#ffe36a", "#7dffb0", "#ff6a2b"];

// An easter egg: every 2–5 minutes a little saucer wobbles across the screen,
// beaming down for a moment mid-flight. To see it on demand, run
// window.dispatchEvent(new Event("airwave:ufo")) in the console.
export function Ufo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: ReturnType<typeof setTimeout>;
    let flying = false;

    const fly = () => {
      const el = ref.current;
      if (!el || flying) return;
      flying = true;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = el.offsetWidth;
      const rightward = Math.random() < 0.5;
      const baseY = vh * (0.16 + Math.random() * 0.5);
      const amplitude = 14 + Math.random() * 26;
      const waves = 1.5 + Math.random() * 2;
      const duration = 7000 + Math.random() * 3000;
      const steps = 40;

      const frames: Keyframe[] = Array.from({ length: steps + 1 }, (_, i) => {
        const t = i / steps;
        const travel = -width * 1.3 + (vw + width * 2.6) * t;
        const x = rightward ? travel : vw - width - travel;
        const phase = Math.sin(t * Math.PI * 2 * waves);
        const y = baseY + phase * amplitude;
        const tilt = Math.cos(t * Math.PI * 2 * waves) * 7;
        return { transform: `translate(${x}px, ${y}px) rotate(${tilt}deg)`, opacity: 1, offset: t };
      });

      const beam = el.querySelector("[data-beam]");
      beam?.animate(
        [
          { opacity: 0, offset: 0 },
          { opacity: 0, offset: 0.42 },
          { opacity: 0.85, offset: 0.48 },
          { opacity: 0.85, offset: 0.56 },
          { opacity: 0, offset: 0.62 },
          { opacity: 0, offset: 1 },
        ],
        { duration, easing: "linear" }
      );

      const animation = el.animate(frames, { duration, easing: "linear" });
      animation.onfinish = animation.oncancel = () => {
        flying = false;
      };
    };

    const schedule = () => {
      const delay = (MIN_DELAY_S + Math.random() * (MAX_DELAY_S - MIN_DELAY_S)) * 1000;
      timer = setTimeout(() => {
        if (document.visibilityState === "visible") fly();
        schedule();
      }, delay);
    };

    schedule();
    window.addEventListener("airwave:ufo", fly);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("airwave:ufo", fly);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed left-0 top-0 z-20 w-20 sm:w-28 pointer-events-none"
      style={{ opacity: 0, willChange: "transform" }}
    >
      <svg viewBox="0 0 120 150" fill="none" overflow="visible">
        <defs>
          <linearGradient id="ufo-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f1f4fb" />
            <stop offset="0.55" stopColor="#9aa4bd" />
            <stop offset="1" stopColor="#4b5470" />
          </linearGradient>
          <radialGradient id="ufo-dome" cx="0.4" cy="0.3" r="0.9">
            <stop offset="0" stopColor="#d9fbff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#5ec8e8" stopOpacity="0.55" />
          </radialGradient>
          <linearGradient id="ufo-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b9ffe0" stopOpacity="0.6" />
            <stop offset="1" stopColor="#b9ffe0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g data-beam style={{ opacity: 0 }}>
          <path d="M46 46 L74 46 L108 148 L12 148 Z" fill="url(#ufo-beam)" />
        </g>
        <path d="M42 32 C42 8 78 8 78 32 Z" fill="url(#ufo-dome)" stroke="#e8fbff" strokeOpacity="0.6" strokeWidth="1" />
        <ellipse cx="60" cy="36" rx="54" ry="14" fill="url(#ufo-body)" />
        <path d="M10 38 Q60 60 110 38 Q60 50 10 38 Z" fill="#39415a" opacity="0.7" />
        {LIGHT_COLORS.map((color, i) => (
          <circle
            key={i}
            className="ufo-light"
            cx={22 + i * 19}
            cy={38 + (i === 0 || i === 4 ? -1 : i === 2 ? 3 : 1)}
            r="3"
            fill={color}
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </svg>
    </div>
  );
}

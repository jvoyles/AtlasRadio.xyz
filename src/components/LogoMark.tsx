import { useId } from "react";

// A globe with a live broadcast point: the sphere carries a light graticule,
// and an orange transmitter dot on its surface sends two signal arcs out past
// the edge — the same orange as the station dots on the real globe.
export function LogoMark({ size = 32 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-sphere`} cx="0.36" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#7fb2ff" />
          <stop offset="0.45" stopColor="#2f6feb" />
          <stop offset="1" stopColor="#15328f" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="14" cy="18" r="12" />
        </clipPath>
      </defs>
      <circle cx="14" cy="18" r="12" fill={`url(#${id}-sphere)`} />
      <g clipPath={`url(#${id}-clip)`} stroke="#fff" strokeOpacity="0.38" strokeWidth="0.9" strokeLinecap="round">
        <ellipse cx="14" cy="18" rx="5.2" ry="12" />
        <path d="M14 6v24" />
        <path d="M2 18h24" />
        <path d="M3.6 11.6q10.4 3 20.8 0" />
        <path d="M3.6 24.4q10.4-3 20.8 0" />
      </g>
      <circle cx="14" cy="18" r="11.6" stroke="#fff" strokeOpacity="0.18" strokeWidth="0.8" />
      <g stroke="#ff6a2b" strokeWidth="2.2" strokeLinecap="round">
        <path d="M22.6 5A6.2 6.2 0 0 1 27.2 10.5" />
        <path d="M23.5 1.7A9.6 9.6 0 0 1 30.6 10.2" strokeOpacity="0.65" />
      </g>
      <circle cx="21" cy="11" r="3.1" fill="#ff6a2b" stroke="#fff" strokeWidth="1" />
    </svg>
  );
}

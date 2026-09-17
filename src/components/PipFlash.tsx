"use client";

// The BBC's real time-signal pips — six short flashes, the last held —
// played once whenever a station starts. The only motion in this world.
const PIPS = [0, 0.15, 0.3, 0.45, 0.6, 0.75];

export function PipFlash({ playKey }: { playKey: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden key={playKey}>
      {PIPS.map((delay, i) => (
        <span
          key={i}
          className="pip w-1 h-1 bg-live"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}

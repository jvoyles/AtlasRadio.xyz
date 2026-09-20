// Five bars that bounce out of phase, like a live level meter. Each bar has its
// own duration and delay so the motion never lines up into a pattern.
const BARS = [
  { duration: 0.9, delay: -0.2 },
  { duration: 1.15, delay: -0.7 },
  { duration: 0.8, delay: -0.45 },
  { duration: 1.05, delay: -0.1 },
  { duration: 0.95, delay: -0.6 },
];

export function EqualizerBars({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-[2px] h-4 ${className}`} aria-hidden="true">
      {BARS.map((bar, i) => (
        <span
          key={i}
          className="eq-bar w-[3px] h-full rounded-full bg-accent-fg"
          style={{ animationDuration: `${bar.duration}s`, animationDelay: `${bar.delay}s` }}
        />
      ))}
    </span>
  );
}

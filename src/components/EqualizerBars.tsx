export function EqualizerBars({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-[2px] h-3 ${className}`} aria-hidden>
      <span className="eq-bar w-[3px] h-full bg-accent rounded-[1px] [animation-delay:-0.4s]" />
      <span className="eq-bar w-[3px] h-full bg-accent rounded-[1px] [animation-delay:-0.2s]" />
      <span className="eq-bar w-[3px] h-full bg-accent rounded-[1px] [animation-delay:-0.6s]" />
    </span>
  );
}

"use client";

export function GenreTile({
  label,
  gradient,
  active,
  onClick,
}: {
  label: string;
  gradient: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full h-20 rounded-2xl overflow-hidden text-left px-4 py-3 shadow-md transition-transform hover:scale-[1.03] bg-gradient-to-br ${gradient} ${
        active ? "ring-2 ring-white/70" : ""
      }`}
    >
      <span className="text-[15px] font-bold text-white drop-shadow">{label}</span>
      <span className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
    </button>
  );
}

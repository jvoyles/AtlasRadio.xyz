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
      className={`relative w-full h-24 rounded-lg overflow-hidden text-left px-4 py-3 shadow-md transition-transform hover:scale-[1.02] bg-gradient-to-br ${gradient} ${
        active ? "ring-2 ring-white" : ""
      }`}
    >
      <span className="text-base font-bold text-white">{label}</span>
      <span className="absolute -bottom-4 -right-2 w-16 h-16 rounded-md bg-black/25 rotate-[24deg]" />
    </button>
  );
}

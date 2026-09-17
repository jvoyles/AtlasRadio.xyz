"use client";

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export function QuickPickCard({
  image,
  title,
  subtitle,
  onClick,
}: {
  image?: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 w-56 shrink-0 bg-surface hover:bg-surface-elevated rounded-lg overflow-hidden transition-colors pr-3"
    >
      <span className="relative w-14 h-14 shrink-0 bg-surface-elevated flex items-center justify-center overflow-hidden">
        {image ? (
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
            <circle cx="12" cy="14" r="4" />
            <path d="M4 14a8 8 0 0 1 16 0" />
          </svg>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayIcon />
        </span>
      </span>
      <span className="min-w-0 text-left">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-[12px] text-muted truncate">{subtitle}</p>
      </span>
    </button>
  );
}

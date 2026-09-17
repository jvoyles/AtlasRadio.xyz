"use client";

import type { ReactNode } from "react";

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export function RailCard({
  image,
  icon,
  title,
  subtitle,
  onClick,
  round = false,
}: {
  image?: string;
  icon?: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  round?: boolean;
}) {
  return (
    <div className="group shrink-0 w-40 p-3 rounded-lg bg-surface hover:bg-surface-elevated transition-colors">
      <div className="relative mb-3">
        <div
          className={`w-full aspect-square overflow-hidden bg-surface-elevated flex items-center justify-center shadow-lg ${
            round ? "rounded-full" : "rounded-md"
          }`}
        >
          {image ? (
            <img
              src={image}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          ) : (
            icon ?? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                <circle cx="12" cy="14" r="4" />
                <path d="M4 14a8 8 0 0 1 16 0" />
              </svg>
            )
          )}
        </div>
        <button
          onClick={onClick}
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-accent text-background flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105 hover:bg-accent-hover"
          aria-label={`Play ${title}`}
        >
          <PlayIcon />
        </button>
      </div>
      <button onClick={onClick} className="text-left w-full">
        <p className="text-sm font-bold truncate">{title}</p>
        <p className="text-[13px] text-muted truncate mt-1">{subtitle}</p>
      </button>
    </div>
  );
}

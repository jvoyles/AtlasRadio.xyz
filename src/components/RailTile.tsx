"use client";

import type { ReactNode } from "react";
import { SignalIcon } from "./SignalIcon";

export function RailTile({
  image,
  icon,
  title,
  subtitle,
  live,
  onClick,
}: {
  image?: string;
  icon?: ReactNode;
  title: string;
  subtitle: string;
  live?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group shrink-0 w-36 text-left rounded-2xl p-2.5 glass-panel transition-transform hover:scale-[1.03] ${
        live ? "ring-1 ring-accent" : ""
      }`}
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-surface-elevated flex items-center justify-center mb-2.5">
        {image ? (
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          icon ?? <SignalIcon className="w-8 h-8 text-muted" />
        )}
        {live && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent shadow-[0_0_6px_1px_var(--color-accent)]" />
        )}
      </div>
      <p className="text-[13px] font-semibold truncate group-hover:text-accent transition-colors">{title}</p>
      <p className="text-[11px] text-muted truncate">{subtitle}</p>
    </button>
  );
}

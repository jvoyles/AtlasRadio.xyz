"use client";

import { useState } from "react";
import type { Station } from "@/lib/radioBrowser";

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export function ShareButton({
  station,
  idleClassName = "text-muted hover:text-foreground",
}: {
  station: Station;
  idleClassName?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = `${station.name} — ${station.country || "internet radio"}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: station.name, text, url: window.location.origin });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${station.url_resolved}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // user cancelled the share sheet, or clipboard access was denied
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`transition-colors ${copied ? "text-accent" : idleClassName}`}
      aria-label="Share station"
      title="Share this station"
    >
      {copied ? <CheckIcon /> : <ShareIcon />}
    </button>
  );
}

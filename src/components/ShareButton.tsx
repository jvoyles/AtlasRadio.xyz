"use client";

import { useState } from "react";
import type { Station } from "@/lib/radioBrowser";
import { CheckIcon as PhCheck, ShareNetworkIcon as PhShare } from "@phosphor-icons/react";

const ShareIcon = () => <PhShare size={18} weight="bold" />;
const CheckIcon = () => <PhCheck size={18} weight="bold" />;


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

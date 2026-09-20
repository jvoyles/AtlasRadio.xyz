"use client";

import { useEffect, useRef, useState } from "react";
import type { Station } from "@/lib/radioBrowser";
import {
  CheckIcon as PhCheck,
  FacebookLogoIcon as PhFacebook,
  LinkSimpleIcon as PhLink,
  ShareNetworkIcon as PhShare,
  WhatsappLogoIcon as PhWhatsapp,
  XLogoIcon as PhX,
} from "@phosphor-icons/react";

export function stationShareUrl(station: Station) {
  return `${window.location.origin}/?station=${encodeURIComponent(station.stationuuid)}`;
}

export function ShareButton({
  station,
  idleClassName = "text-muted hover:text-foreground",
  placement = "top",
}: {
  station: Station;
  idleClassName?: string;
  placement?: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    items()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "Tab") {
        setOpen(false);
      } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const list = items();
        const i = list.indexOf(document.activeElement as HTMLElement);
        const next =
          e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
        list[next]?.focus();
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shareText = `Listening to ${station.name} on Atlas Radio`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(stationShareUrl(station));
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1100);
    } catch {
      // clipboard access denied — nothing useful to fall back to
    }
  };

  const openShare = (base: string, params: Record<string, string>) => {
    window.open(`${base}?${new URLSearchParams(params)}`, "_blank", "noopener,noreferrer,width=640,height=560");
    setOpen(false);
  };

  const url = () => stationShareUrl(station);
  const items = [
    { label: copied ? "Link copied" : "Copy Link", icon: copied ? PhCheck : PhLink, onClick: copyLink, divider: true },
    {
      label: "Share on X",
      icon: PhX,
      onClick: () => openShare("https://twitter.com/intent/tweet", { text: shareText, url: url() }),
    },
    {
      label: "Share on Facebook",
      icon: PhFacebook,
      onClick: () => openShare("https://www.facebook.com/sharer/sharer.php", { u: url() }),
    },
    {
      label: "Share on WhatsApp",
      icon: PhWhatsapp,
      onClick: () => openShare("https://wa.me/", { text: `${shareText} ${url()}` }),
    },
  ];

  return (
    <div ref={rootRef} className="relative flex items-center">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className={`p-2 -m-2 rounded-full transition-colors ${open ? "text-ink" : idleClassName}`}
        aria-label="Share station"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Share this station"
      >
        <PhShare size={18} weight="bold" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Share station"
          className={`absolute right-0 z-50 w-56 rounded-2xl border border-white/10 bg-[rgba(10,14,23,0.97)] backdrop-blur-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] p-1.5 ${
            placement === "top" ? "bottom-full mb-4" : "top-full mt-4"
          }`}
        >
          {items.map(({ label, icon: Icon, onClick, divider }) => (
            <div key={label}>
              <button
                role="menuitem"
                tabIndex={-1}
                onClick={onClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ink hover:bg-white/[0.08] transition-colors text-left"
              >
                <Icon size={18} weight="bold" className="text-ink-muted shrink-0" />
                {label}
              </button>
              {divider && <div role="separator" className="my-1.5 mx-3 h-px bg-white/10" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

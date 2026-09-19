"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlassIcon as PhSearch, XIcon as PhClose } from "@phosphor-icons/react";

export function GlobalSearch({
  className = "",
  inputClassName = "rounded-full bg-paper-elevated text-ink placeholder:text-ink-muted",
}: {
  className?: string;
  inputClassName?: string;
}) {
  return (
    <Suspense fallback={null}>
      <GlobalSearchContent className={className} inputClassName={inputClassName} />
    </Suspense>
  );
}

function GlobalSearchContent({
  className,
  inputClassName,
}: {
  className: string;
  inputClassName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(activeQuery);

  // Keep the field in sync when the URL's ?q= changes from elsewhere (e.g.
  // the user clears search results via the Back button) — adjusting state
  // during render, not in an effect, avoids an extra cascading render.
  const [trackedQuery, setTrackedQuery] = useState(activeQuery);
  if (activeQuery !== trackedQuery) {
    setTrackedQuery(activeQuery);
    setValue(activeQuery);
  }

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === activeQuery) return;

    const timeout = setTimeout(() => {
      router.replace(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <PhSearch size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        type="search"
        placeholder="Find a station or city…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`w-full pl-10 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${inputClassName}`}
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
          aria-label="Clear search"
        >
          <PhClose size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}

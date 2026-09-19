"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function GlobalSearch({ className = "" }: { className?: string }) {
  return (
    <Suspense fallback={null}>
      <GlobalSearchContent className={className} />
    </Suspense>
  );
}

function GlobalSearchContent({ className }: { className: string }) {
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
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-[13px]">&gt;</span>
      <input
        type="search"
        placeholder="search stations…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full pl-7 pr-7 py-1.5 bg-transparent border border-border text-[13px] placeholder:text-muted focus:outline-none focus:border-live"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-[13px]"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}

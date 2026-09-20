import type { Station } from "@/lib/radioBrowser";
import { sanitizeStation } from "@/lib/sanitize";

// Radio Browser returns ~1.2 KB of metadata per station and there are
// 12k+ working ones with coordinates (~16 MB in total). This route pages
// through them, keeps only the fields the globe needs, and lets the CDN
// cache each page so the client downloads a few MB instead of the raw dump.
export const GEO_PAGE_SIZE = 1500;

// The upstream directory can take several seconds on a cold cache; the default
// serverless limit on free plans is short.
export const maxDuration = 30;

const MIRRORS = [
  "https://de1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
];

type Raw = unknown;

async function fetchPage(page: number): Promise<Raw[]> {
  const query = new URLSearchParams({
    has_geo_info: "true",
    hidebroken: "true",
    order: "clickcount",
    reverse: "true",
    limit: String(GEO_PAGE_SIZE),
    offset: String(page * GEO_PAGE_SIZE),
  });
  let lastError: unknown;
  for (const base of MIRRORS) {
    try {
      const res = await fetch(`${base}/json/stations/search?${query}`, {
        headers: { "User-Agent": "AtlasRadio/1.0 (+https://www.atlasradio.xyz)" },
        next: { revalidate: 21600 },
      });
      if (!res.ok) throw new Error(`${base} responded ${res.status}`);
      return (await res.json()) as Raw[];
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export async function GET(request: Request) {
  const page = Math.max(0, Math.min(50, Number(new URL(request.url).searchParams.get("page")) || 0));
  try {
    const raw = await fetchPage(page);
    const stations = raw
      .map((s) => sanitizeStation(s))
      .filter((s): s is Station => s !== null && s.geo_lat !== null && s.geo_long !== null)
      .map((s) => ({
        ...s,
        tags: s.tags.split(",").slice(0, 4).join(","),
        geo_lat: Math.round((s.geo_lat as number) * 1e4) / 1e4,
        geo_long: Math.round((s.geo_long as number) * 1e4) / 1e4,
      }));
    return Response.json(
      { stations, done: raw.length < GEO_PAGE_SIZE },
      { headers: { "Cache-Control": "public, max-age=900, s-maxage=21600, stale-while-revalidate=86400" } }
    );
  } catch {
    return Response.json({ stations: [], done: true }, { status: 502 });
  }
}

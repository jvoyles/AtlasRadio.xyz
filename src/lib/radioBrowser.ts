import { isStationUuid, sanitizeStation, sanitizeStations } from "@/lib/sanitize";

export type Station = {
  stationuuid: string;
  name: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  country: string;
  clickcount?: number;
  geo_lat?: number | null;
  geo_long?: number | null;
};

const MIRRORS = [
  "https://de1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
];

const USER_AGENT = "AtlasRadio/1.0 (+https://www.atlasradio.xyz)";

type ApiParams = Record<string, string | number | boolean>;

async function apiFetch<T>(path: string, params: ApiParams = {}): Promise<T> {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  ).toString();

  let lastError: unknown;
  for (const base of MIRRORS) {
    try {
      const res = await fetch(`${base}${path}${query ? `?${query}` : ""}`, {
        headers: { "User-Agent": USER_AGENT },
        next: { revalidate: 3600 },
      });
      if (!res.ok) throw new Error(`Radio Browser mirror ${base} responded ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export function searchStations(params: {
  name?: string;
  tag?: string;
  country?: string;
  limit?: number;
  order?: string;
}) {
  return apiFetch<unknown>("/json/stations/search", {
    limit: 200,
    order: "clickcount",
    reverse: true,
    hidebroken: true,
    ...params,
  }).then(sanitizeStations);
}

export function topStations(limit = 40) {
  const n = Math.max(1, Math.min(200, Math.floor(limit) || 40));
  return apiFetch<unknown>(`/json/stations/topclick/${n}`, {
    hidebroken: true,
  }).then(sanitizeStations);
}

/** Look up one station by its Radio Browser uuid (used by shared links). */
export async function stationByUuid(uuid: string) {
  if (!isStationUuid(uuid)) return null;
  const [station] = await apiFetch<unknown[]>(`/json/stations/byuuid/${uuid}`);
  return sanitizeStation(station);
}

export function registerClick(stationuuid: string) {
  if (!isStationUuid(stationuuid)) return Promise.resolve(null);
  return apiFetch(`/json/url/${encodeURIComponent(stationuuid)}`);
}

let geoCache: Station[] | null = null;

/**
 * Streams every working station that has coordinates (12k+) from our own
 * paging route, calling `onUpdate` with the full de-duplicated list as each
 * batch of pages lands, so the globe can start showing the most-listened
 * stations immediately. The finished list is kept for the rest of the
 * session so navigating between sections doesn't re-download it.
 */
export async function loadAllGeoStations(onUpdate: (stations: Station[]) => void, signal?: AbortSignal) {
  if (geoCache) {
    onUpdate(geoCache);
    return;
  }
  // The upstream is latency-bound (~2 s per page regardless of size), so pages
  // are fetched by a small pool of workers, and the map is refreshed at most
  // every 400 ms so re-clustering 12k points doesn't run once per page.
  const CONCURRENCY = 4;
  const seen = new Map<string, Station>();
  let nextPage = 0;
  let finished = false;
  let dirty = false;
  let lastEmit = 0;
  let pending: ReturnType<typeof setTimeout> | null = null;

  const emit = () => {
    pending = null;
    lastEmit = Date.now();
    dirty = false;
    onUpdate([...seen.values()]);
  };
  const scheduleEmit = () => {
    dirty = true;
    if (pending) return;
    pending = setTimeout(emit, Math.max(0, 400 - (Date.now() - lastEmit)));
  };

  const worker = async () => {
    while (!finished && !signal?.aborted) {
      const page = nextPage++;
      const body = await fetch(`/api/stations/geo?page=${page}`, { signal })
        .then((r) => (r.ok ? (r.json() as Promise<{ stations: Station[]; done: boolean }>) : { stations: [], done: true }))
        .catch(() => ({ stations: [] as Station[], done: true }));
      if (signal?.aborted) return;
      for (const st of sanitizeStations(body.stations)) seen.set(st.stationuuid, st);
      if (body.done) finished = true;
      scheduleEmit();
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (signal?.aborted) {
    if (pending) clearTimeout(pending);
    return;
  }
  if (pending) clearTimeout(pending);
  if (dirty || seen.size > 0) emit();
  if (seen.size > 0) geoCache = [...seen.values()];
}

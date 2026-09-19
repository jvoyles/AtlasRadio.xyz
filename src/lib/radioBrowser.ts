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

const USER_AGENT = "radio-app/1.0 (portfolio project)";

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
  return apiFetch<Station[]>("/json/stations/search", {
    limit: 200,
    order: "clickcount",
    reverse: true,
    hidebroken: true,
    ...params,
  });
}

export function topStations(limit = 40) {
  return apiFetch<Station[]>(`/json/stations/topclick/${limit}`, {
    hidebroken: true,
  });
}

/** Look up one station by its Radio Browser uuid (used by shared links). */
export async function stationByUuid(uuid: string) {
  if (!/^[0-9a-f-]{36}$/i.test(uuid)) return null;
  const [station] = await apiFetch<Station[]>(`/json/stations/byuuid/${uuid}`);
  return station ?? null;
}

export function registerClick(stationuuid: string) {
  return apiFetch(`/json/url/${stationuuid}`);
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
  const CONCURRENCY = 3;
  const seen = new Map<string, Station>();
  let page = 0;
  let done = false;
  while (!done && !signal?.aborted) {
    const batch = await Promise.all(
      Array.from({ length: CONCURRENCY }, (_, i) =>
        fetch(`/api/stations/geo?page=${page + i}`, { signal })
          .then((r) => (r.ok ? (r.json() as Promise<{ stations: Station[]; done: boolean }>) : { stations: [], done: true }))
          .catch(() => ({ stations: [] as Station[], done: true }))
      )
    );
    if (signal?.aborted) return;
    for (const b of batch) for (const st of b.stations) seen.set(st.stationuuid, st);
    onUpdate([...seen.values()]);
    done = batch.some((b) => b.done);
    page += CONCURRENCY;
  }
  if (!signal?.aborted && seen.size > 0) geoCache = [...seen.values()];
}

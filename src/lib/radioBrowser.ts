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
    limit: 40,
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

/** Stations whose listing was most recently added or updated on Radio Browser. */
export function recentlyAdded(limit = 20) {
  return apiFetch<Station[]>("/json/stations/lastchange", {
    limit,
    hidebroken: true,
  });
}

export function listTags(limit = 60) {
  return apiFetch<{ name: string; stationcount: number }[]>("/json/tags", {
    limit,
    order: "stationcount",
    reverse: true,
  });
}

export function listCountries(limit = 60) {
  return apiFetch<{ name: string; stationcount: number; iso_3166_1: string }[]>(
    "/json/countries",
    {
      limit,
      order: "stationcount",
      reverse: true,
    }
  );
}

export function registerClick(stationuuid: string) {
  return apiFetch(`/json/url/${stationuuid}`);
}

/** Stations that carry real geo coordinates, for plotting on the night-sea map. */
export function stationsWithGeo(limit = 700) {
  return apiFetch<Station[]>("/json/stations/search", {
    limit,
    has_geo_info: true,
    order: "clickcount",
    reverse: true,
    hidebroken: true,
  });
}

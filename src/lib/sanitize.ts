import type { Station } from "@/lib/radioBrowser";

// Station records come from a public, community-edited directory and from
// localStorage, so they're treated as untrusted. Every one is normalised here
// before it reaches the player, the map or the UI.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const INTERNAL_SUFFIXES = [".local", ".localhost", ".internal", ".localdomain", ".lan", ".home", ".corp", ".intranet"];

function isPrivateIpv4(host: string) {
  const m = host.match(IPV4);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

/**
 * True only for http(s) URLs pointing at a public host. Stops a malicious
 * station entry from making the listener's browser fetch loopback, LAN,
 * link-local or cloud-metadata addresses (the URL parser has already
 * normalised decimal/hex/octal IP tricks to dotted form by this point).
 */
export function isPublicHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  if (!host || host.startsWith("[")) return false;
  if (host === "localhost" || !host.includes(".")) return false;
  if (INTERNAL_SUFFIXES.some((s) => host.endsWith(s))) return false;
  if (IPV4.test(host)) return !isPrivateIpv4(host);
  return true;
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export function isStationUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** Returns a clean Station, or null if it can't be safely played. */
export function sanitizeStation(raw: unknown): Station | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isStationUuid(r.stationuuid) || !isPublicHttpUrl(r.url_resolved)) return null;

  const lat = typeof r.geo_lat === "number" && Math.abs(r.geo_lat) <= 90 ? r.geo_lat : null;
  const long = typeof r.geo_long === "number" && Math.abs(r.geo_long) <= 180 ? r.geo_long : null;

  return {
    stationuuid: r.stationuuid,
    name: text(r.name, 200).trim() || "Unknown station",
    url_resolved: r.url_resolved,
    favicon: isPublicHttpUrl(r.favicon) ? r.favicon : "",
    tags: text(r.tags, 300),
    country: text(r.country, 100),
    clickcount: typeof r.clickcount === "number" && Number.isFinite(r.clickcount) ? r.clickcount : undefined,
    geo_lat: lat !== null && long !== null ? lat : null,
    geo_long: lat !== null && long !== null ? long : null,
  };
}

export function sanitizeStations(raw: unknown): Station[] {
  return Array.isArray(raw) ? raw.map(sanitizeStation).filter((s): s is Station => s !== null) : [];
}

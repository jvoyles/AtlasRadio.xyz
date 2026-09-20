// The canonical origin, used for absolute URLs in metadata, the sitemap and
// social images. Set NEXT_PUBLIC_SITE_URL once a custom domain exists; on
// Vercel the production URL is picked up automatically.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "Airwave";
export const SITE_TAGLINE = "Live radio from around the world";
export const SITE_DESCRIPTION =
  "Tune into thousands of live internet radio stations on an interactive globe. Spin the world, find a station, and listen free — no ads, no account.";

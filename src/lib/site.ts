// The canonical origin, used for absolute URLs in metadata, the sitemap and
// social images. Production builds on Vercel default to the custom domain;
// preview deployments use their own URL. NEXT_PUBLIC_SITE_URL overrides both.
const PRODUCTION_URL = "https://www.atlasradio.xyz";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_ENV === "production"
    ? PRODUCTION_URL
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "Atlas Radio";
export const SITE_TAGLINE = "Live radio from around the world";
export const SITE_DESCRIPTION =
  "Tune into thousands of live internet radio stations on an interactive globe. Spin the world, find a station, and listen free — no ads, no account.";

export const AUTHOR_NAME = "Jacob Voyles";
export const AUTHOR_URL = "https://www.jacobvoyles.com";

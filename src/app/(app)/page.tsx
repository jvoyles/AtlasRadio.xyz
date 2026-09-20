import type { Metadata } from "next";
import BrowsePage from "@/components/BrowsePage";
import { stationByUuid } from "@/lib/radioBrowser";
import { isStationUuid } from "@/lib/sanitize";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const { q, section, station } = await searchParams;
  const stationId = Array.isArray(station) ? station[0] : station;
  const query = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 80);

  if (isStationUuid(stationId)) {
    const found = await stationByUuid(stationId).catch(() => null);
    if (found) {
      const title = `${found.name} — listen live`;
      const description = `${found.name}${found.country ? ` from ${found.country}` : ""} — listen live on ${SITE_NAME}, the interactive radio globe. Free, no account.`;
      const images = [{ url: `/api/og?station=${stationId}`, width: 1200, height: 630, alt: found.name }];
      return {
        title,
        description,
        alternates: { canonical: `/?station=${stationId}` },
        openGraph: { title, description, url: `/?station=${stationId}`, images },
        twitter: { card: "summary_large_image", title, description, images },
      };
    }
  }

  // Search results are thin, infinite-variety pages: keep them out of the index.
  if (query) return { title: `Results for “${query}”`, robots: { index: false, follow: true } };
  if (section === "trending") {
    return {
      title: "Trending stations",
      description: `The most-listened live radio stations on ${SITE_NAME} right now.`,
      alternates: { canonical: "/?section=trending" },
    };
  }
  return { title: { absolute: `${SITE_NAME} — ${SITE_TAGLINE}` }, description: SITE_DESCRIPTION };
}

export default function Page() {
  return <BrowsePage />;
}

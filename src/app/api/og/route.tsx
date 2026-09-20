import { ImageResponse } from "next/og";
import { OgCard } from "@/lib/ogCard";
import { stationByUuid } from "@/lib/radioBrowser";
import { isStationUuid } from "@/lib/sanitize";
import { SITE_NAME } from "@/lib/site";

// Social preview for a shared station link (/?station=<uuid>). Text only: the
// card never fetches a station's own logo URL server-side.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("station");
  const station = isStationUuid(id) ? await stationByUuid(id).catch(() => null) : null;

  const card = station ? (
    <OgCard
      eyebrow={`${SITE_NAME} · Now playing`}
      title={station.name}
      subtitle={station.country ? `Live from ${station.country}` : "Live internet radio"}
      chips={station.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3)}
      cta="Listen live on Airwave"
    />
  ) : (
    <OgCard eyebrow={SITE_NAME} title="Tune into the world's radio" subtitle="Thousands of live stations on an interactive globe." />
  );

  return new ImageResponse(card, {
    width: 1200,
    height: 630,
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
  });
}

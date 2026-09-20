import { ImageResponse } from "next/og";
import { OgCard } from "@/lib/ogCard";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — live radio from around the world`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow={SITE_NAME}
        title="Tune into the world's radio"
        subtitle="Thousands of live stations on an interactive globe. Free, no ads, no account."
        chips={["Live radio", "12,000+ stations"]}
      />
    ),
    size
  );
}

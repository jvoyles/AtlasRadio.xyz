"use client";

import { useEffect, useRef } from "react";

// The rooftop sliver in the source photo's bottom-left corner gets cropped
// off here so only real sky and cloud remain.
const CROP_BOTTOM_PX = 140;

function loadCroppedSky(onReady: (dataUrl: string) => void) {
  const img = new Image();
  img.src = "/textures/sky-source.jpg";
  img.onload = () => {
    const height = img.naturalHeight - CROP_BOTTOM_PX;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, img.naturalWidth, height, 0, 0, img.naturalWidth, height);
    onReady(canvas.toDataURL("image/jpeg", 0.92));
  };
}

// A real photo, not a synthetic shape, is the only thing that reads as
// genuinely realistic clouds — two prior attempts at drawing or distorting
// shapes on top of it looked fake. So the "animation" is a slow Ken Burns
// pan-and-zoom on the photo itself: a transform, not a redraw, so nothing
// about the photo's own detail ever changes, only the framing of it.
export function SkyBackground() {
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCroppedSky((dataUrl) => {
      if (photoRef.current) photoRef.current.style.backgroundImage = `url(${dataUrl})`;
    });
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, #1c5fa8 0%, #3f83c2 55%, #a9c9dd 100%)",
        }}
      />
      <div
        ref={photoRef}
        className="sky-photo-pan absolute inset-0"
        style={{
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "35% 35%",
        }}
      />
    </div>
  );
}

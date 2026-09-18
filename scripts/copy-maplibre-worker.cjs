// MapLibre GL JS resolves its worker script relative to its own module
// URL at runtime, which breaks under bundlers (Turbopack, Webpack, Vite)
// that serve the library under a content-hashed chunk path with no real
// sibling file next to it — the worker fetch 404s and the map never
// finishes loading its style. The documented fix is `config.WORKER_URL`
// (set in src/components/Globe.tsx) pointing at a stable, real path; this
// script keeps that path's files in sync with whatever maplibre-gl
// version is installed. Runs automatically via package.json's postinstall.
const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "..", "node_modules", "maplibre-gl", "dist");
const outDir = path.join(__dirname, "..", "public");
const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

for (const file of files) {
  const src = path.join(srcDir, file);
  if (!fs.existsSync(src)) {
    console.warn(`copy-maplibre-worker: ${file} not found in maplibre-gl/dist, skipping`);
    continue;
  }
  fs.copyFileSync(src, path.join(outDir, file));
}
console.log("copy-maplibre-worker: synced maplibre-gl worker files to public/");

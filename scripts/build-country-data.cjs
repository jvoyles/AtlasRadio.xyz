// One-off build script: converts world-atlas's public-domain (Natural
// Earth) country TopoJSON into a compact JSON asset the globe renders
// directly, with each country's polygon rings (for fill/border drawing)
// and a label anchor point + relative area (for label decluttering).
// Run with: node scripts/build-country-data.cjs
const fs = require("fs");
const path = require("path");
const topojson = require("topojson-client");
const data = require("world-atlas/countries-110m.json");

const geo = topojson.feature(data, data.objects.countries);

// Rings crossing the antimeridian (e.g. Fiji) jump from ~180 to ~-180
// between consecutive points; a naive planar shoelace/average on raw
// longitudes treats that as a huge jump across the whole map instead of
// a small step across the date line. Unwrap by accumulating the smallest
// delta at each step before doing area/centroid math, then wrap back.
function unwrapLongitudes(ring) {
  const out = [ring[0].slice()];
  for (let i = 1; i < ring.length; i++) {
    const prevLon = out[i - 1][0];
    let lon = ring[i][0];
    while (lon - prevLon > 180) lon -= 360;
    while (lon - prevLon < -180) lon += 360;
    out.push([lon, ring[i][1]]);
  }
  return out;
}

function ringArea(ring) {
  const u = unwrapLongitudes(ring);
  let sum = 0;
  for (let i = 0; i < u.length - 1; i++) {
    const [x1, y1] = u[i];
    const [x2, y2] = u[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

function wrapLon(lon) {
  let l = lon;
  while (l > 180) l -= 360;
  while (l < -180) l += 360;
  return l;
}

function ringCentroid(ring) {
  const u = unwrapLongitudes(ring);
  let x = 0, y = 0;
  for (const [lon, lat] of u) {
    x += lon;
    y += lat;
  }
  return [wrapLon(x / u.length), y / u.length];
}

const countries = geo.features
  .filter((f) => f.properties.name && f.geometry)
  .map((f) => {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    const rings = [];
    let largest = null;
    let largestArea = -1;
    for (const poly of polys) {
      const outer = poly[0];
      // Store each ring pre-unwrapped so the client never has to detect
      // the antimeridian jump itself — it just draws three shifted copies
      // (x, x-W, x+W) of the same continuous path for seamless wraparound.
      rings.push(
        poly.map((ring) => unwrapLongitudes(ring).map(([lon, lat]) => [Math.round(lon * 100) / 100, Math.round(lat * 100) / 100]))
      );
      const area = ringArea(outer);
      if (area > largestArea) {
        largestArea = area;
        largest = outer;
      }
    }
    const [labelLon, labelLat] = ringCentroid(largest);
    return {
      name: f.properties.name,
      rings,
      label: [Math.round(labelLon * 100) / 100, Math.round(labelLat * 100) / 100],
      area: Math.round(largestArea * 100) / 100,
    };
  });

const outPath = path.join(__dirname, "..", "src", "data", "countries.json");
fs.writeFileSync(outPath, JSON.stringify(countries));
console.log(`Wrote ${countries.length} countries to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);

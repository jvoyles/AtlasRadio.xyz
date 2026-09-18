import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // One-off Node build tooling, not app source.
    "scripts/**",
    // Vendored MapLibre worker chunks (see scripts/copy-maplibre-worker.cjs)
    // — third-party minified output, not app source.
    "public/maplibre-gl-worker.mjs",
    "public/maplibre-gl-shared.mjs",
  ]),
]);

export default eslintConfig;

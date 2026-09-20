# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: portfolio reviewers and hiring managers evaluating the builder's skills by browsing and demoing the app. Secondary: casual listeners who want to find and stream free internet radio stations without ads, a subscription, or an account.

## Product Purpose

Airwave lets anyone browse and stream free internet radio stations from around the world by genre or country, with liked stations saved locally in the browser (there are no accounts). It exists first as a portfolio piece demonstrating full-stack product and design skills; holding up as a genuinely usable radio app is a secondary goal.

## Positioning

Zero-cost, ad-free, no-account-required browsing and listening — powered entirely by the free, open Radio Browser API and free-tier hosting (Vercel). Unlike TuneIn, a car's built-in radio app, or Apple Music's Radio tab, there's no app install, no account wall to start listening, and no ads. There are no accounts at all; likes are kept in the browser's localStorage.

## Operating Context

A responsive web app, desktop-first with real mobile support (on touch screens a first tap on a globe dot previews the station in its tooltip and a second tap tunes in; the player dock shows the station name; the now-playing view scrolls fully; safe-area insets are respected), with a floating top bar made of three glass islands over the globe (globe-emoji logo (also the favicon) that pings while a station plays; a nav capsule whose soft highlight slides to the active section; a glass pill search field that glows on focus; the nav collapses to a floating hamburger card on mobile) in a dark UI theme (near-black background, light foreground, blue accent), matching a specific reference the user pointed to (devglobe.app/space) 1:1. Studying that reference's actual code (via browser devtools/JS introspection, not just its screenshots) showed the globe itself is not a custom 3D scene at all: it's **MapLibre GL JS** in native globe-projection mode, rendering **OpenFreeMap's free "liberty" vector-tile style** (real OpenStreetMap data, ODbL-licensed, no API key, no usage cap, no cost) — real country borders, water, and place labels with genuine label collision, not a rasterized or hand-rolled texture. The home surface now uses that same stack directly: MapLibre's globe projection over OpenFreeMap tiles, the reference's own custom WebGL layers ported into the map (a 26,000-star celestial sphere that rotates with the camera so the background turns in 3D, and a blue atmosphere-halo glow around the sphere), its recolored terrain palette over the liberty style's natural-earth raster, a 2D canvas for the occasional comet (skipped under prefers-reduced-motion), and the same radial-gradient div behind the (transparent-background) map matching the reference's own layered DOM structure, every working Radio Browser station that has coordinates (12k+, paged in through a slimming `/api/stations/geo` route, most-listened first) as a clustered GeoJSON source (count bubbles that zoom in on click, symbol layer of canvas-animated pulsing dots (signal-orange core with an expanding ring, grouped into larger, well-spaced count bubbles so dense regions like Europe stay legible, phase-offset so they breathe out of sync; the playing station is a larger white dot with a thick orange ring, soft shadow and double pulse rings), with a glass hover tooltip (name, country, tags, listen count, favicon) that also pauses the auto-spin. Stations Radio Browser has no coordinates for (~40k) are not pinned but stay reachable through search (up to 200 results per query), and a small OpenFreeMap/OpenStreetMap attribution control kept (collapsed to an info button on load, expandable on click) (kept even though the reference hides it, since the underlying map data's ODbL license requires attribution). Floating chrome (the player dock is a full-width rounded-rectangle glass bar with a rounded-square station logo, matching the top-bar glass, plus the now-playing card) is dark glass (blurred, translucent, light hairline border) instead of the earlier opaque light "paper card," also matching the reference. Navigation is that top bar (Globe, Trending, Liked, search) rather than a sidebar; the globe is the product, so the earlier Countries and Genres pages were removed. Trending, Liked and search results remain as list views beneath the same top bar. Playback happens via a floating player dock that can expand into a full "Now Playing" view. There is no login; liked stations live in the browser.

## Capabilities and Constraints

- Browse trending stations; search by name (a glass command-palette search bar with live suggestions, keyboard navigation and a `/` or Ctrl/Cmd-K shortcut); drag-rotate a real MapLibre GL globe (OpenFreeMap vector tiles: real country borders/labels, real station geo-pins) to tune in, and tuning in from anywhere (a dot or the search box) glides the globe to that station.
- Play live streams directly in the browser (the client connects straight to each station's stream URL — no server-side audio proxying or storage).
- Like stations and revisit them on the Liked page (stored in the browser's localStorage; no accounts, no backend).
- Shuffle to another station from recent history; history-based previous/next; auto-reconnect toggle if a stream drops; share a station from a menu (Copy Link, X, Facebook, WhatsApp) via a deep link (`/?station=<uuid>`) that cues the station and glides the globe to it.
- Security posture: strict nonce-based CSP and hardened response headers; all station data is sanitized as untrusted input (public http(s) URLs only); no accounts, secrets or server-side user data.
- Performance posture: the map library (~800 KB) is lazy-loaded only for the globe view (Trending/Liked/search ship ~65% less JS), the now-playing view is lazy-loaded, station pages stream in through a pooled, throttled loader, dot animation runs at 30 fps, list logos are lazy/async-decoded, and API/worker files carry cache headers.
- Accessibility posture: audited with axe-core against WCAG 2.0/2.1/2.2 A and AA plus best-practice rules (zero violations on the globe, Trending, search results, the search dropdown, the share menu, the now-playing dialog and the mobile menu). Full keyboard operation (skip links, ARIA combobox search, arrow-key share menu, focus-trapped dialog with Esc and focus return), labelled controls with `aria-pressed` toggles, a polite live region for playback state, per-view page titles, text and icon contrast of at least 4.5:1 / 3:1, 24px+ touch targets, and `prefers-reduced-motion` honoured (no spin, dot pulsing, comets or camera flights). The globe itself is a visual map; its keyboard/screen-reader equivalent is Trending and search.
- **Hard constraint:** the project must stay zero-cost. No paid APIs, no paid hosting tiers, no paid services of any kind may be introduced.

## Brand Commitments

Name: "Airwave." The home surface's history: a rotating 3D globe (deep-space cosmic → aizuri-e woodblock → night-earth city-lights → celestial star atlas), unpinned after five skins failed on "hard to find/click" and "ugly" → an eBoy-style isometric pixel city, rejected as "an ugly Rubik's cube" → an atmospheric country-card grid grounded in real Mobbin screens, which fixed legibility but read as "just the countries page" → a flat bioluminescent night-sea map (superseded before shipping) → a photo-textured realistic globe (NASA Blue Marble) with a light UI theme → a real sky-photo-plus-clouds background exploration (three rounds chasing "realistic clouds") → a first data-driven vector globe attempt: real country borders/labels hand-rolled from Natural Earth data onto a custom Three.js sphere, plus a dark UI and blue accent, after the user pointed to devglobe.app/space and asked to match it 1:1 → the current build, after the user asked to actually study that reference's code: it turned out devglobe.app isn't a custom 3D scene at all, it's MapLibre GL JS's native globe projection over OpenFreeMap's free "liberty" vector-tile style (real OpenStreetMap data, ODbL, no cost) — so the hand-rolled Three.js globe and its Natural Earth build step were replaced with that exact stack, which is what actually produces devglobe's real label collision, borders, and water rendering rather than an approximation of them. The dark theme, blue accent (replacing vermillion), and glass floating chrome (replacing the opaque cream "paper card" used since the aizuri-e round) carried forward from that round unchanged. Fraunces (serif, for names/headings) plus Inter (sans, for UI) still carry the type; icons are Phosphor (soft, rounded, filled transport controls and bold-outline everything else). List rows highlight edge to edge across the full width. Held at full fidelity, not a placeholder.

## Evidence on Hand

None. No real testimonials, case studies, press, or user data exist — this is a personal portfolio project with no production users yet. Future work must not fabricate any of the above.

## Product Principles

1. Zero cost, always — never trade the free-tier architecture for a paid convenience.
2. Frictionless browsing — there are no accounts or login walls of any kind.
3. Portfolio-grade polish — craft and visual quality matter as much as function, since the primary audience is reviewers, not a captive user base.
4. Borrow proven interaction patterns deliberately, but render the visual world as its own invention rather than a literal skin of a reference — and be willing to replace the mechanism itself, not just its skin, when the mechanism is the actual problem.

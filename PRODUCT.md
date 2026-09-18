# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: portfolio reviewers and hiring managers evaluating the builder's skills by browsing and demoing the app. Secondary: casual listeners who want to find and stream free internet radio stations without ads, a subscription, or an account.

## Product Purpose

Airwave lets anyone browse and stream free internet radio stations from around the world by genre or country, with optional accounts to save favorite stations. It exists first as a portfolio piece demonstrating full-stack product and design skills; holding up as a genuinely usable radio app is a secondary goal.

## Positioning

Zero-cost, ad-free, no-account-required browsing and listening — powered entirely by the free, open Radio Browser API and free-tier hosting (Vercel + Supabase). Unlike TuneIn, a car's built-in radio app, or Apple Music's Radio tab, there's no app install, no account wall to start listening, and no ads. An account is only needed to save favorites.

## Operating Context

A responsive web app, desktop-first with mobile support, in a dark UI theme (near-black background, light foreground, blue accent), matching a specific reference the user pointed to (devglobe.app/space) 1:1. Studying that reference's actual code (via browser devtools/JS introspection, not just its screenshots) showed the globe itself is not a custom 3D scene at all: it's **MapLibre GL JS** in native globe-projection mode, rendering **OpenFreeMap's free "liberty" vector-tile style** (real OpenStreetMap data, ODbL-licensed, no API key, no usage cap, no cost) — real country borders, water, and place labels with genuine label collision, not a rasterized or hand-rolled texture. The home surface now uses that same stack directly: MapLibre's globe projection over OpenFreeMap tiles, a plain starfield canvas + radial-gradient div behind the (transparent-background) map matching the reference's own layered DOM structure, station geo-pins as a GeoJSON circle layer, and a small OpenFreeMap/OpenStreetMap attribution control left visible (kept even though the reference hides it, since the underlying map data's ODbL license requires attribution). Floating chrome (nav pill, player dock, now-playing card, auth form) is dark glass (blurred, translucent, light hairline border) instead of the earlier opaque light "paper card," also matching the reference. Navigation is a floating pill bar (Home, Trending, Countries, Genres, Liked, search) overlaying the content rather than a fixed sidebar. Trending/Countries/Genres/Favorites still exist as list-based fallback browsing beneath the same floating nav. Playback happens via a floating player dock that can expand into a full "Now Playing" view. Logging in is only required to save/view favorite stations — browsing and listening never require it.

## Capabilities and Constraints

- Browse trending stations, genres, and countries; search by name; drag-rotate a real MapLibre GL globe (OpenFreeMap vector tiles: real country borders/labels, real station geo-pins) to tune in, or browse a glowing grid of country cards (flag, name, real station count) via the Countries nav item.
- Play live streams directly in the browser (the client connects straight to each station's stream URL — no server-side audio proxying or storage).
- Save favorite stations (requires a Supabase account).
- Shuffle to another station from recent history; history-based previous/next; auto-reconnect toggle if a stream drops; share a station.
- **Hard constraint:** the project must stay zero-cost. No paid APIs, no paid hosting tiers, no paid services of any kind may be introduced.

## Brand Commitments

Name: "Airwave." The home surface's history: a rotating 3D globe (deep-space cosmic → aizuri-e woodblock → night-earth city-lights → celestial star atlas), unpinned after five skins failed on "hard to find/click" and "ugly" → an eBoy-style isometric pixel city, rejected as "an ugly Rubik's cube" → an atmospheric country-card grid grounded in real Mobbin screens, which fixed legibility but read as "just the countries page" → a flat bioluminescent night-sea map (superseded before shipping) → a photo-textured realistic globe (NASA Blue Marble) with a light UI theme → a real sky-photo-plus-clouds background exploration (three rounds chasing "realistic clouds") → a first data-driven vector globe attempt: real country borders/labels hand-rolled from Natural Earth data onto a custom Three.js sphere, plus a dark UI and blue accent, after the user pointed to devglobe.app/space and asked to match it 1:1 → the current build, after the user asked to actually study that reference's code: it turned out devglobe.app isn't a custom 3D scene at all, it's MapLibre GL JS's native globe projection over OpenFreeMap's free "liberty" vector-tile style (real OpenStreetMap data, ODbL, no cost) — so the hand-rolled Three.js globe and its Natural Earth build step were replaced with that exact stack, which is what actually produces devglobe's real label collision, borders, and water rendering rather than an approximation of them. The dark theme, blue accent (replacing vermillion), and glass floating chrome (replacing the opaque cream "paper card" used since the aizuri-e round) carried forward from that round unchanged. Fraunces (serif, for names/headings) plus Inter (sans, for UI) still carry the type. Held at full fidelity, not a placeholder.

## Evidence on Hand

None. No real testimonials, case studies, press, or user data exist — this is a personal portfolio project with no production users yet. Future work must not fabricate any of the above.

## Product Principles

1. Zero cost, always — never trade the free-tier architecture for a paid convenience.
2. Frictionless browsing — no login wall to listen; accounts only gate favorites.
3. Portfolio-grade polish — craft and visual quality matter as much as function, since the primary audience is reviewers, not a captive user base.
4. Borrow proven interaction patterns deliberately, but render the visual world as its own invention rather than a literal skin of a reference — and be willing to replace the mechanism itself, not just its skin, when the mechanism is the actual problem.

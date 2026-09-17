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

A responsive web app, desktop-first with mobile support, in a dark UI theme (near-black background, light foreground, blue accent), matching a specific reference the user pointed to (devglobe.app/space) 1:1. The home surface is a data-driven vector political globe (Three.js): real country boundaries and borders (Natural Earth data via the public-domain `world-atlas` package, pre-processed into a compact JSON asset at build time by `scripts/build-country-data.cjs`) are rasterized into an equirectangular texture with vivid flat land/ocean fills, wrapped on a rotating sphere. Country name labels for the largest ~60 countries render as always-camera-facing sprites, hidden per-frame once they rotate onto the far hemisphere and decluttered against each other in screen space so labels never stack (real map labels never overlap; naive hemisphere-only culling did). A strong additive glow halo rings the limb — transparent over the globe's own disc so it never washes out the surface or its labels — over a starfield, matching devglobe's deep-space look. Real station geo-pins sit on the sphere and are clickable to tune in. Floating chrome (nav pill, player dock, now-playing card, auth form) is dark glass (blurred, translucent, light hairline border) instead of the earlier opaque light "paper card," also matching the reference. Navigation is a floating pill bar (Home, Trending, Countries, Genres, Liked, search) overlaying the content rather than a fixed sidebar. Trending/Countries/Genres/Favorites still exist as list-based fallback browsing beneath the same floating nav. Playback happens via a floating player dock that can expand into a full "Now Playing" view. Logging in is only required to save/view favorite stations — browsing and listening never require it.

## Capabilities and Constraints

- Browse trending stations, genres, and countries; search by name; drag-rotate a vector political globe (real country borders/labels, real station geo-pins) to tune in, or browse a glowing grid of country cards (flag, name, real station count) via the Countries nav item.
- Play live streams directly in the browser (the client connects straight to each station's stream URL — no server-side audio proxying or storage).
- Save favorite stations (requires a Supabase account).
- Shuffle to another station from recent history; history-based previous/next; auto-reconnect toggle if a stream drops; share a station.
- **Hard constraint:** the project must stay zero-cost. No paid APIs, no paid hosting tiers, no paid services of any kind may be introduced.

## Brand Commitments

Name: "Airwave." The home surface's history: a rotating 3D globe (deep-space cosmic → aizuri-e woodblock → night-earth city-lights → celestial star atlas), unpinned after five skins failed on "hard to find/click" and "ugly" → an eBoy-style isometric pixel city, rejected as "an ugly Rubik's cube" → an atmospheric country-card grid grounded in real Mobbin screens, which fixed legibility but read as "just the countries page" → a flat bioluminescent night-sea map (superseded before shipping) → a photo-textured realistic globe (NASA Blue Marble) with a light UI theme, following the user's own reference images of desktop relief globes → a real sky-photo-plus-clouds background exploration (three rounds chasing "realistic clouds," eventually resolved by dropping synthetic cloud shapes and animating the real photo itself) → the current data-driven vector globe, built after the user pointed to a specific reference site (devglobe.app/space) and asked to match its UI 1:1: real country borders and labels (Natural Earth data, public domain) instead of a photographic or procedural texture, a strong glow halo, a starfield, and the whole UI flipped from light back to dark with a blue accent (replacing vermillion) and glass floating chrome (replacing the opaque cream "paper card" used since the aizuri-e round) — a deliberate, faithful match to the linked reference rather than a rolled or invented direction. Fraunces (serif, for names/headings) plus Inter (sans, for UI) still carry the type. Held at full fidelity, not a placeholder.

## Evidence on Hand

None. No real testimonials, case studies, press, or user data exist — this is a personal portfolio project with no production users yet. Future work must not fabricate any of the above.

## Product Principles

1. Zero cost, always — never trade the free-tier architecture for a paid convenience.
2. Frictionless browsing — no login wall to listen; accounts only gate favorites.
3. Portfolio-grade polish — craft and visual quality matter as much as function, since the primary audience is reviewers, not a captive user base.
4. Borrow proven interaction patterns deliberately, but render the visual world as its own invention rather than a literal skin of a reference — and be willing to replace the mechanism itself, not just its skin, when the mechanism is the actual problem.

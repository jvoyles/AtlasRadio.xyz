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

A responsive web app, desktop-first with mobile support. The home surface is a full-bleed, zoomable isometric pixel city (flat 2D SVG, no 3D/WebGL): one colorful building per country, height scaled by its real station count, hover to read a country's name and station count, click to drill into that country's station list. This replaces the earlier interactive 3D globe (Three.js, radio.garden-style spatial browsing by geo-coordinate) — the globe's rotate-and-click mechanic was a pinned, durable decision through five straight visual redesigns, but the user ultimately unpinned it after every skin (cosmic, aizuri-e, night-earth, celestial star atlas) still failed the same complaint: hard to find/click a station, and "ugly." The pixel city fixes that directly — every interactive element is a big, always-hoverable, labeled block, not a tiny point on a rotating sphere. Navigation is a floating pill bar (Home, Trending, Countries, Genres, Liked, search) overlaying the city rather than a fixed sidebar. Trending/Countries/Genres/Favorites still exist as list-based fallback browsing beneath the same floating nav. Playback happens via a floating player dock that can expand into a full "Now Playing" view. Logging in is only required to save/view favorite stations — browsing and listening never require it.

## Capabilities and Constraints

- Browse trending stations, genres, and countries; search by name; pan/zoom a pixel-art city of countries (building height = real station count) and click a building to see that country's stations.
- Play live streams directly in the browser (the client connects straight to each station's stream URL — no server-side audio proxying or storage).
- Save favorite stations (requires a Supabase account).
- Shuffle to another station from recent history; history-based previous/next; auto-reconnect toggle if a stream drops; share a station.
- **Hard constraint:** the project must stay zero-cost. No paid APIs, no paid hosting tiers, no paid services of any kind may be introduced.

## Brand Commitments

Name: "Airwave." The home surface went through five straight visual redesigns of a rotating 3D globe (deep-space cosmic → aizuri-e woodblock → night-earth city-lights → celestial star atlas) before the user concluded the globe mechanic itself, not just its skin, was the problem: pins were hard to find and click, and every skin still read as "ugly." The user explicitly unpinned the globe as a durable decision, and a fresh Impeccable direction round (scoped to the whole browsing mechanism, not a sphere skin) replaced it with an eBoy-style pixorama: a colorful, zoomable isometric pixel city where each country is a building, height scaled by its real station count, full-saturation flat colors with zero anti-aliasing, hovering any building pops a legible label naming the country and its station count, and clicking drills into that country's station list. Floating chrome (nav pill, player dock, now-playing card, auth form) stays the earlier aizuri-e system: opaque cream "paper card" stock with a hairline ink border, not frosted glass. Fraunces (serif, for names/headings) plus Inter (sans, for UI) carry the type. Held at full fidelity, not a placeholder.

## Evidence on Hand

None. No real testimonials, case studies, press, or user data exist — this is a personal portfolio project with no production users yet. Future work must not fabricate any of the above.

## Product Principles

1. Zero cost, always — never trade the free-tier architecture for a paid convenience.
2. Frictionless browsing — no login wall to listen; accounts only gate favorites.
3. Portfolio-grade polish — craft and visual quality matter as much as function, since the primary audience is reviewers, not a captive user base.
4. Borrow proven interaction patterns deliberately, but render the visual world as its own invention rather than a literal skin of a reference — and be willing to replace the mechanism itself, not just its skin, when the mechanism is the actual problem.

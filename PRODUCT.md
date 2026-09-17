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

A responsive web app, desktop-first with mobile support. The home surface is a scrollable, atmospheric grid of country cards: each card shows a flag, the country's real name, and its real station count, always legible with no hover required, over a slow-drifting ambient glow backdrop (radio.garden's moody dark atmosphere, translated into the app's own accent color rather than copied). Clicking a card drills into that country's station list. This replaced an isometric pixel-city grid (each country a colorful building) after the user said it "looks like an ugly Rubik's cube" — packed edge-to-edge with no gaps and no visible labels. Before rebuilding, real screens from Spotify, Deezer, Apple Music, YouTube Music, TIDAL, and Duolingo were pulled via Mobbin: every one of them browses categories as a gapped grid of flat, always-labeled cards, never a packed 3D block — that evidence, not another guess, set the current execution. The pixel city itself had replaced an interactive 3D globe (Three.js, radio.garden-style spatial browsing by geo-coordinate) after five straight globe-skin redesigns (cosmic → aizuri-e → night-earth → celestial star atlas) all failed on "hard to find/click a station" and "ugly" — the user unpinned the globe mechanic itself as a result. Navigation is a floating pill bar (Home, Trending, Countries, Genres, Liked, search) overlaying the content rather than a fixed sidebar. Trending/Countries/Genres/Favorites still exist as list-based fallback browsing beneath the same floating nav. Playback happens via a floating player dock that can expand into a full "Now Playing" view. Logging in is only required to save/view favorite stations — browsing and listening never require it.

## Capabilities and Constraints

- Browse trending stations, genres, and countries; search by name; browse a glowing grid of country cards (flag, name, real station count) and click one to see that country's stations.
- Play live streams directly in the browser (the client connects straight to each station's stream URL — no server-side audio proxying or storage).
- Save favorite stations (requires a Supabase account).
- Shuffle to another station from recent history; history-based previous/next; auto-reconnect toggle if a stream drops; share a station.
- **Hard constraint:** the project must stay zero-cost. No paid APIs, no paid hosting tiers, no paid services of any kind may be introduced.

## Brand Commitments

Name: "Airwave." The home surface has been through several redesigns: a rotating 3D globe (deep-space cosmic → aizuri-e woodblock → night-earth city-lights → celestial star atlas), unpinned by the user after all five skins failed on "hard to find/click" and "ugly"; then an eBoy-style isometric pixel city (one building per country), rejected as "an ugly Rubik's cube" for packing buildings edge-to-edge with no gaps or visible labels. The current surface is an atmospheric country-card grid, grounded in real screens pulled from Mobbin (Spotify, Deezer, Apple Music, YouTube Music, TIDAL, Duolingo all browse categories the same way: a gapped grid of flat, always-labeled cards) fused with the moody, glowing dark atmosphere of radio.garden, which the user asked to keep even after moving off a literal globe. Each card: a thin per-country accent-color bar (deterministic per country name), a flag, the country's name in serif, and its real station count, all legible without hovering, on the app's translucent `--surface` glass token over a slow-drifting ambient glow (vermillion + deep indigo blooms, not a copied palette). Floating chrome (nav pill, player dock, now-playing card, auth form) stays the earlier aizuri-e system: opaque cream "paper card" stock with a hairline ink border, not frosted glass. Fraunces (serif, for names/headings) plus Inter (sans, for UI) carry the type. Held at full fidelity, not a placeholder.

## Evidence on Hand

None. No real testimonials, case studies, press, or user data exist — this is a personal portfolio project with no production users yet. Future work must not fabricate any of the above.

## Product Principles

1. Zero cost, always — never trade the free-tier architecture for a paid convenience.
2. Frictionless browsing — no login wall to listen; accounts only gate favorites.
3. Portfolio-grade polish — craft and visual quality matter as much as function, since the primary audience is reviewers, not a captive user base.
4. Borrow proven interaction patterns deliberately, but render the visual world as its own invention rather than a literal skin of a reference — and be willing to replace the mechanism itself, not just its skin, when the mechanism is the actual problem.

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

A responsive web app, desktop-first with mobile support, in a light UI theme. Behind everything (site-wide, not just the home surface) is a procedural sky: a deep-to-pale blue gradient with a handful of individually-placed, individually-shaped cumulus clusters (not a continuous noise field) drifting slowly at two parallax speeds — each cluster is a soft radial falloff perturbed by its own fractal noise for an organic silhouette, with a light-direction sample darkening its underside for a volumetric look. Iterated twice against a real sky photo the user supplied as reference: a first pass (flat radial-gradient blobs) read as fake; a second pass (a full noise field) fixed the fake-blob look but read as one continuous marbled texture with too many clouds and an ugly drift; the current version's sparse, individually-shaped clusters are what actually matches a real scattered cumulus sky. The home surface is a realistic, photo-textured 3D globe (Three.js) the visitor drags to rotate, appearing to float in that sky: a real NASA Blue Marble satellite image (public domain) provides true coastlines, recolored client-side so the ocean reads as the vivid, saturated blue of a classic desktop relief globe rather than true-color satellite navy, lit by a single directional "sun" light so a real day/night terminator sweeps across it. Station pins sit at their real geo-coordinates and are clickable to tune in. This re-pins the globe as the home mechanism after it had been unpinned (see Brand Commitments for the full back-and-forth); the Countries nav page keeps its separate atmospheric country-card grid, unaffected. Navigation is a floating pill bar (Home, Trending, Countries, Genres, Liked, search) overlaying the content rather than a fixed sidebar. Trending/Countries/Genres/Favorites still exist as list-based fallback browsing beneath the same floating nav. Playback happens via a floating player dock that can expand into a full "Now Playing" view. Logging in is only required to save/view favorite stations — browsing and listening never require it.

## Capabilities and Constraints

- Browse trending stations, genres, and countries; search by name; drag-rotate a realistic 3D globe with real station geo-pins to tune in, or browse a glowing grid of country cards (flag, name, real station count) via the Countries nav item.
- Play live streams directly in the browser (the client connects straight to each station's stream URL — no server-side audio proxying or storage).
- Save favorite stations (requires a Supabase account).
- Shuffle to another station from recent history; history-based previous/next; auto-reconnect toggle if a stream drops; share a station.
- **Hard constraint:** the project must stay zero-cost. No paid APIs, no paid hosting tiers, no paid services of any kind may be introduced.

## Brand Commitments

Name: "Airwave." The home surface's history: a rotating 3D globe (deep-space cosmic → aizuri-e woodblock → night-earth city-lights → celestial star atlas), unpinned after five skins failed on "hard to find/click" and "ugly" → an eBoy-style isometric pixel city, rejected as "an ugly Rubik's cube" → an atmospheric country-card grid grounded in real Mobbin screens (Spotify, Deezer, Apple Music, YouTube Music, TIDAL, Duolingo), which fixed legibility but read as "just the countries page," lacking its own identity → a flat bioluminescent night-sea map (drag-to-pan, glowing wake, built but superseded before shipping). The user then explicitly re-requested a literal, realistic 3D globe with reference images of real desktop relief globes (vivid saturated blue ocean, dramatic single-light-source shading) and asked for a light UI theme — re-pinning the globe as a deliberate, evidence-and-reference-driven choice rather than a rolled direction. Built with a real NASA Blue Marble satellite texture (public domain, true coastlines), client-side recolored so the ocean reads as vivid relief-globe blue instead of true-color navy, lit by one directional light for a real day/night terminator, orbit-controlled drag-to-rotate. The Countries nav page keeps its own country-card grid, unaffected by the home surface's history. The whole UI flipped from dark to a light theme (warm off-white background, dark ink foreground) at the same time; floating chrome (nav pill, player dock, now-playing card, auth form) keeps its aizuri-e paper-card material — opaque cream card stock with a hairline ink border — which was designed for exactly this light-card-over-content look and needed no changes. Fraunces (serif, for names/headings) plus Inter (sans, for UI) carry the type. Held at full fidelity, not a placeholder.

## Evidence on Hand

None. No real testimonials, case studies, press, or user data exist — this is a personal portfolio project with no production users yet. Future work must not fabricate any of the above.

## Product Principles

1. Zero cost, always — never trade the free-tier architecture for a paid convenience.
2. Frictionless browsing — no login wall to listen; accounts only gate favorites.
3. Portfolio-grade polish — craft and visual quality matter as much as function, since the primary audience is reviewers, not a captive user base.
4. Borrow proven interaction patterns deliberately, but render the visual world as its own invention rather than a literal skin of a reference — and be willing to replace the mechanism itself, not just its skin, when the mechanism is the actual problem.

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

A responsive web app, desktop-first with mobile support. The home surface is a full-bleed interactive 3D globe (Three.js) plotting live stations by their real geo-coordinates from the Radio Browser API — drag to rotate, click a glowing point to tune in, modeled on radio.garden's spatial-browsing idea. The globe's own mechanic is a pinned, durable product decision; its visual skin has iterated separately. Navigation is a floating pill bar (Home, Trending, Countries, Genres, Liked, search) overlaying the globe rather than a fixed sidebar. Trending/Countries/Genres/Favorites still exist as list-based fallback browsing beneath the same floating nav. Playback happens via a floating player dock that can expand into a full "Now Playing" view. Logging in is only required to save/view favorite stations — browsing and listening never require it.

## Capabilities and Constraints

- Browse trending stations, genres, and countries; search by name; spin a 3D globe of real station geo-coordinates and click a point to tune in.
- Play live streams directly in the browser (the client connects straight to each station's stream URL — no server-side audio proxying or storage).
- Save favorite stations (requires a Supabase account).
- Shuffle to another station from recent history; history-based previous/next; auto-reconnect toggle if a stream drops; share a station.
- **Hard constraint:** the project must stay zero-cost. No paid APIs, no paid hosting tiers, no paid services of any kind may be introduced.

## Brand Commitments

Name: "Airwave." The radio.garden-style interactive globe is now a pinned, durable product decision — it stays through future visual redesigns. Its skin, however, has iterated repeatedly: an initial "deep-space cosmic" pass (teal/magenta neon-glass), then an aizuri-e (Hokusai-style indigo woodblock print) globe with real landmass silhouettes, which the user found too literal/map-like ("looks like Earth"). The current skin is a night-earth world, pinned directly by the user via a reference (Dribbble "Globe Interaction for Airtel" by tekzenit), overriding an Impeccable-rolled shortwave-dial pick that was never built: a near-black sphere where continents read only as a faint charcoal silhouette against pure-black ocean, brought to life by scattered warm city-light glow dots clustered over land; a cool blue-white atmospheric rim light; a starfield over a painted violet/indigo/rose nebula backdrop instead of flat black. Station pins are small warm-red glowing points that brighten into a larger pulsing glow when a station plays. Floating chrome (nav pill, player dock, now-playing card, auth form) stays the earlier aizuri-e system: opaque cream "paper card" stock with a hairline ink border, not frosted glass. Fraunces (serif, for names/headings) plus Inter (sans, for UI) carry the type. Held at full fidelity, not a placeholder.

## Evidence on Hand

None. No real testimonials, case studies, press, or user data exist — this is a personal portfolio project with no production users yet. Future work must not fabricate any of the above.

## Product Principles

1. Zero cost, always — never trade the free-tier architecture for a paid convenience.
2. Frictionless browsing — no login wall to listen; accounts only gate favorites.
3. Portfolio-grade polish — craft and visual quality matter as much as function, since the primary audience is reviewers, not a captive user base.
4. Borrow proven interaction patterns deliberately (currently radio.garden's spatial globe-browsing), but render the visual world as its own invention rather than a literal skin of the reference.

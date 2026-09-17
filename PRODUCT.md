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

A responsive web app, desktop-first with mobile support. Navigation lives in a persistent left sidebar (Home, Search, Trending, Countries, Genres, Liked Stations). Playback happens via a persistent bottom player bar that can expand into a full "Now Playing" view. Logging in is only required to save/view favorite stations — browsing and listening never require it.

## Capabilities and Constraints

- Browse trending stations, genres, and countries; search by name.
- Play live streams directly in the browser (the client connects straight to each station's stream URL — no server-side audio proxying or storage).
- Save favorite stations (requires a Supabase account).
- Shuffle to another station from recent history; history-based previous/next; auto-reconnect toggle if a stream drops; share a station.
- **Hard constraint:** the project must stay zero-cost. No paid APIs, no paid hosting tiers, no paid services of any kind may be introduced.

## Brand Commitments

Name: "Airwave." After several bespoke visual-world experiments (a cassette-deck fascia, a radar console, a color-reactive glass canvas, a teletext bulletin), the user explicitly chose the category standard as the standing direction: a Spotify-style UI — dark sidebar-driven navigation, rounded album-art cards, a single saturated accent color for buttons/active states, a persistent bottom player bar — with Spotify and YouTube Music named as the craft bar to build against, held at full fidelity rather than treated as a placeholder.

## Evidence on Hand

None. No real testimonials, case studies, press, or user data exist — this is a personal portfolio project with no production users yet. Future work must not fabricate any of the above.

## Product Principles

1. Zero cost, always — never trade the free-tier architecture for a paid convenience.
2. Frictionless browsing — no login wall to listen; accounts only gate favorites.
3. Portfolio-grade polish — craft and visual quality matter as much as function, since the primary audience is reviewers, not a captive user base.
4. Borrow proven patterns deliberately — the UI actively models established products (currently Apple Music) rather than inventing a visual language from scratch.

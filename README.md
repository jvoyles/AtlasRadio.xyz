# Airwave — Internet Radio

A Spotify-style web app for browsing and streaming free internet radio stations from around the world.

## Stack

- **Next.js** (App Router) + Tailwind CSS
- **Radio Browser API** ([radio-browser.info](https://www.radio-browser.info/)) — free, open station directory. No key required. The browser connects directly to each station's stream URL, so there's no audio bandwidth cost on our side.
- No backend or accounts. Liked stations are stored in the browser's `localStorage`.

## Setup

```bash
npm install
npm run dev
```

## Notes

- Deploys cleanly to Vercel's free tier. No environment variables are needed.

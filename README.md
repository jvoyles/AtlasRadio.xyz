# Airwave — Internet Radio

A Spotify-style web app for browsing and streaming free internet radio stations from around the world.

## Stack

- **Next.js** (App Router) + Tailwind CSS
- **Radio Browser API** ([radio-browser.info](https://www.radio-browser.info/)) — free, open station directory. No key required. The browser connects directly to each station's stream URL, so there's no audio bandwidth cost on our side.
- **Supabase** (free tier) — auth + a `favorites` table

## Setup

1. Create a project at [supabase.com](https://supabase.com) (or use an existing one).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) to create the `favorites` table and its row-level security policies.
3. Copy `.env.local.example` to `.env.local` and fill in your project's URL and anon key (Project Settings → API):

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

4. Install and run:

   ```bash
   npm install
   npm run dev
   ```

## Notes

- By default, Supabase requires email confirmation for new signups. You can turn this off in Authentication → Providers → Email if you want instant sign-in during development.
- Deploys cleanly to Vercel's free tier. Add the two env vars in the Vercel project settings.

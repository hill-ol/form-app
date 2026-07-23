# Moving off Supabase: Neon + self-hosted PostgREST

Your app only ever uses `supabase-js`'s plain REST query builder (`.from().select()...`)
— no auth, storage, or realtime. That query builder is just a thin wrapper around
`@supabase/postgrest-js`, talking to any PostgREST server. So instead of another
managed "Supabase-like" product, you just need: a Postgres database (Neon) + a
PostgREST server in front of it (Render). No changes to `src/lib/db.ts` needed —
only the two `NEXT_PUBLIC_SUPABASE_*` values in `.env.local` change.

(This originally targeted Fly.io — see `fly.toml` — but Fly now requires a card
on file before creating any app, even free ones, so we moved to Render, which
doesn't for a single free web service.)

## 0. Try it locally first (optional but recommended)

From this directory:
```bash
docker compose up
```
This spins up a throwaway Postgres (seeded with `../db/schema.sql` automatically)
and PostgREST on `http://localhost:3001`. Point `.env.local` at it temporarily:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_ANON_KEY=anything-non-empty
```
Run `npm run dev` and click around — if it works here, the same setup will work
in production. Tear down with `docker compose down -v` when done.

## 1. Create the Neon project

1. Sign up at [neon.tech](https://neon.tech) (free tier: 0.5GB storage, auto-suspends
   when idle and **wakes automatically on the next query** — no manual "unpause"
   button to hunt for, unlike Supabase).
2. Create a project. Note the **region** — pick the one closest to Render's `oregon`
   region (or change `region:` in `render.yaml` / the dashboard to match Neon instead).
3. Open the SQL Editor for your new project and run the contents of
   [`../db/schema.sql`](../db/schema.sql) — but first **change the placeholder
   password**:
   ```sql
   create role web_anon with login password 'PICK-A-REAL-PASSWORD-HERE';
   ```
   (edit that line in `schema.sql` before running it, or run the file as-is and
   then `alter role web_anon with password 'PICK-A-REAL-PASSWORD-HERE';` after).
4. From the Neon dashboard, grab the connection string for the `web_anon` role
   specifically (Neon lets you pick which role's credentials to show) — it'll
   look like:
   ```
   postgres://web_anon:PICK-A-REAL-PASSWORD-HERE@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   Save this — it's `PGRST_DB_URI` in step 2 below.

## 2. Deploy PostgREST on Render (dashboard, no repo connection needed)

1. Sign up at [render.com](https://render.com) — no card required for a free web service.
2. **New +** → **Web Service** → choose **"Deploy an existing image from a registry"**
   (this skips connecting a GitHub repo entirely — we're just running a public image).
3. Image URL: `docker.io/postgrest/postgrest:v12.2.3`
4. Name: `form-app-db-api` (or whatever — you'll get a `<name>.onrender.com` URL).
5. Instance type: **Free**.
6. Port: `3000` (PostgREST's default).
7. Add environment variables:
   | Key | Value |
   |---|---|
   | `PGRST_DB_URI` | `postgres://web_anon:PICK-A-REAL-PASSWORD-HERE@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require` |
   | `PGRST_DB_SCHEMA` | `public` |
   | `PGRST_DB_ANON_ROLE` | `web_anon` |
   | `PGRST_SERVER_PORT` | `3000` |
   | `PGRST_DB_PREPARED_STATEMENTS` | `false` |
8. Create Web Service. Render will pull the image and deploy — first deploy takes
   a minute or two.

`render.yaml` in this folder documents the same config if you'd rather connect
the repo and use Render's Blueprint flow instead — functionally identical.

## 3. Verify it's alive

```bash
curl https://<your-app-name>.onrender.com/workout_sessions
```
Should return `[]` (empty array — no sessions yet), not an error. If it hangs
on the first request, that's Render's free-tier cold start (spins down after
15 min idle, ~30-60s to wake back up) — just retry.

## 4. Point the app at it

In `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-app-name>.onrender.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=anything-non-empty
```
The "anon key" can be any non-empty string — PostgREST here has no `PGRST_JWT_SECRET`
configured, so it never validates the `Authorization`/`apikey` headers sent
alongside requests; every request just uses the `web_anon` role from `PGRST_DB_URI`.
That matches how this app already worked (no per-user auth, RLS disabled everywhere).

**One code change was required** (already applied in this repo): `supabase-js`'s
`createClient()` always hardcodes a `/rest/v1` path prefix on every request,
matching Supabase's own gateway routing — but a standalone PostgREST serves
tables at the bare root. `src/lib/supabase.ts` now constructs a `PostgrestClient`
from `@supabase/postgrest-js` directly (the library `supabase-js` wraps
internally) instead of using `createClient`, which talks to the bare URL with
no prefix. `src/lib/db.ts` needed zero changes — the `.from()` query builder
API is identical either way. If you ever point this back at real Supabase,
swap `supabase.ts` back to `createClient` from `@supabase/supabase-js`.

Restart `npm run dev` after editing `.env.local` and confirm the dashboard loads
data instead of showing the old "Failed to load..." errors.

## Notes

- **Cost**: Neon's free tier and Render's free web service tier should cover a
  single-user app like this indefinitely, at the price of a cold start after
  15 minutes of inactivity.
- **Cold starts**: if the ~30-60s wake-up delay bothers you, Render's cheapest
  paid tier ($7/mo) keeps the service warm — not necessary to start.
- **Schema changes going forward**: since there's no Supabase Studio anymore, use
  Neon's built-in SQL editor (or `psql "postgres://web_anon:...@.../neondb"`) to
  run migrations by hand. Keep `../db/schema.sql` updated as the source of truth.
- **Backups**: Neon's free tier keeps point-in-time recovery for a short window;
  don't rely on it long-term for data you can't afford to lose.
- **`08P01: prepared statement "..." already exists` / `already in use` errors**:
  Neon's connection string is usually the *pooled* endpoint (hostname contains
  `-pooler`), which routes through Neon's built-in PgBouncer in transaction
  mode. PostgREST enables server-side prepared statements by default, but
  those don't survive transaction-mode pooling — each transaction can land on
  a different physical backend connection, so a statement name prepared on
  one connection collides with (or vanishes from under) another. Fixed by
  setting `PGRST_DB_PREPARED_STATEMENTS=false`, which makes PostgREST use the
  simple query protocol instead. If this ever recurs, confirm that env var is
  still set on the Render service (it's not something the app or schema
  controls) — or switch `PGRST_DB_URI` to Neon's *unpooled* connection string
  instead, at the cost of PostgREST managing its own connection limit against
  Neon directly.
- **`fly.toml` / `docker-compose.yml`'s Fly bits**: left in place in case you add
  a card to Fly later and want to switch — nothing else in this folder depends on it.

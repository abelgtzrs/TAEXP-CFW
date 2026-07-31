# Developer Notes — server (API + Static)

This is the single API the clients talk to. It also serves static assets under `/public`.

## Entry points

- `server.js` — boots Express, connects MongoDB, wires middleware, static file serving, and routes
- `routes/**` — endpoint definitions grouped by domain
- `controllers/**` — request handlers with business logic
- `models/**` — Mongoose schemas for base data and user-owned collections
- `public/**` — static files (pokemon sprites, habbo rares, uploads)

## Static files

- Served at `/` from `public/` and `/uploads` for user uploads. Image paths in the DB are stored as relative paths like `/pokemon/gen5ani/...`.

## Environment

Create `server/.env` (see `.env.example`):

- `MONGO_URI` (required)
- `JWT_SECRET` (required)
- `PORT` (default 5000)
- `FRONTEND_URL` (for redirects)
- Optional Spotify creds: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`
- Optional Media Tracker creds: `TMDB_API_KEY` (movie search), `RAWG_API_KEY` (game search)

## Scripts I actually use

- `npm run dev` — dev server (nodemon)
- `npm start` — production
- `npm run data:import` / `npm run data:destroy` — seed/clear collections (`seeder.js`)
- `npm run personas:seed` / `npm run personas:clear` — Abel persona seed helpers
- `npm run strokes:seed` / `npm run strokes:clear` — additional data helpers
- `npm run diagnose` — deployment diagnostics

## Patterns I follow

- Controllers are skinny wrappers around model operations with clear error paths
- Middleware handles auth (`protect`) and roles (`authorize`) so route handlers stay focused
- Large one-off scripts live at the repo root of the server and are run directly with node

## Gotchas I’ve hit (and fixed)

- Finance models must be required in `server.js` or nothing persists (see `DEPLOYMENT_FIXES_SUMMARY.md`)
- Static directories must exist in prod (`public/uploads/avatars/` etc.)
- Never hardcode `localhost` in controllers that redirect (Spotify) — use envs

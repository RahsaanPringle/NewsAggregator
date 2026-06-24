# News Aggregator Dashboard

This Vite app now reads news data through a local JSON Server cache instead of calling RapidAPI directly from the browser on every page load.

## How it works

- The React UI requests `/api/news`.
- A local JSON Server route checks `server/db.json` for a cached response keyed by endpoint and query params.
- Cache entries are stored in endpoint-specific collections such as `rapid-api_topic-headlines` and `rapid-api_full-story-coverage`.
- Cached entries newer than 24 hours are returned immediately.
- Expired or missing entries are refreshed from RapidAPI and then written back to the local JSON store.
- If refresh fails but a cached payload exists, the server returns the cached payload as a fallback.

## Environment

Set one of these before starting the local cache server:

- `RAPIDAPI_KEY`
- `VITE_RAPIDAPI_KEY`

Your existing `.env.local` file can still hold `VITE_RAPIDAPI_KEY` for local development.

## Scripts

- `npm run dev` starts both the Vite frontend and the local JSON Server cache API.
- `npm run dev:client` starts only the Vite frontend.
- `npm run server` starts the local JSON Server cache API on port `4000`.
- `npm run dev:all` is an alias for `npm run dev`.
- `npm run build` builds the frontend.
- `npm run lint` runs ESLint.

## Cache inspection

While the server is running, cached responses are stored in `server/db.json` under endpoint-specific top-level collections. Existing legacy `cacheEntries` data is migrated automatically on server startup.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

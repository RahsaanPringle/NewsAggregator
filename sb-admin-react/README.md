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

To enable MySQL article sync, also set:

- `VITE_NEWS_API_BASE_URL` (optional)
	- Set to `http://localhost:4001` for local standalone API development.
	- Set to `https://NewsAPI.YubTub.club` for production.
	- Leave empty to use same-origin routes.

- `MYSQL_HOST`
- `MYSQL_PORT` (defaults to `3306`)
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

You can copy `.env.local.example` to `.env.local` and fill in your values.

If you are using the standalone `news-api` project, the frontend only needs `VITE_NEWS_API_BASE_URL` for MySQL sync calls. In that setup, MySQL credentials belong in the API project's `.env.local`, not the frontend.

## MySQL Setup

1. Install a MySQL manager tool (pick one):
	 - MySQL Workbench
	 - DBeaver
	 - HeidiSQL
	 - phpMyAdmin (if your host already provides it)
2. Connect using your host credentials.
3. Run `server/sql/create_news_articles_table.sql` against your database.
4. Start the app with `npm run dev`.

The local cache server also auto-creates `news_articles` on first MySQL request, but running the SQL script explicitly is recommended.

## MySQL Sync API

- `POST /api/mysql/articles/status`
	- Request body: `{ "articles": [ ... ] }`
	- Response includes `existingArticleHashes` so the UI can hide add buttons for records already saved.
- `POST /api/mysql/articles`
	- Request body: `{ "article": { ... }, "endpointPath": "/topic-headlines", "queryParams": { ... } }`
	- Inserts the article into MySQL if it does not already exist.

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

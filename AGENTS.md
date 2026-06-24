# AGENTS Guide for NewsAggregator

## Scope

- Primary app: [sb-admin-react](sb-admin-react)
- Template source: [startbootstrap-sb-admin-2-gh-pages](startbootstrap-sb-admin-2-gh-pages)
- Project-wide runbook: [INSTRUCTIONS.md](INSTRUCTIONS.md)

## Fast Start

Run all app commands from [sb-admin-react](sb-admin-react).

1. Install dependencies: npm install
2. Start full dev stack: npm run dev
3. Build: npm run build

Notes:
- npm run dev starts both Vite and the local cache server.
- If Vite port 5173 is busy, it may move to another port.

## Architecture Boundaries

- UI entry: [sb-admin-react/src/main.jsx](sb-admin-react/src/main.jsx)
- App shell and script loading: [sb-admin-react/src/App.jsx](sb-admin-react/src/App.jsx)
- Dashboard composition: [sb-admin-react/src/components/DashboardContent.jsx](sb-admin-react/src/components/DashboardContent.jsx) and [sb-admin-react/src/components/DashboardRows.jsx](sb-admin-react/src/components/DashboardRows.jsx)
- News data rendering and fetch contract: [sb-admin-react/src/components/NewsDataTable.jsx](sb-admin-react/src/components/NewsDataTable.jsx)
- Local cache API: [sb-admin-react/server/news-cache-server.cjs](sb-admin-react/server/news-cache-server.cjs)
- Cache datastore: [sb-admin-react/server/db.json](sb-admin-react/server/db.json)
- Dev proxy rules: [sb-admin-react/vite.config.js](sb-admin-react/vite.config.js)

## Data Flow Expectations

1. Frontend requests /api/news via Vite.
2. Vite proxies to local server on port 4000.
3. Local server reads endpoint-specific cache collections in db.json.
4. If cache is stale or missing, server refreshes from RapidAPI.
5. Server returns payload to UI and updates cache.

Treat the local server as the source of truth for frontend news data. Do not reintroduce direct browser calls to external news APIs.

## Conventions for Changes

- Keep cache logic in [sb-admin-react/server/news-cache-server.cjs](sb-admin-react/server/news-cache-server.cjs).
- Keep UI components presentation-focused; avoid adding external API logic in component files.
- Preserve endpoint-derived cache collection naming for multi-API readiness.
- If changing request/response shapes, update both:
  - [sb-admin-react/server/news-cache-server.cjs](sb-admin-react/server/news-cache-server.cjs)
  - [sb-admin-react/src/components/NewsDataTable.jsx](sb-admin-react/src/components/NewsDataTable.jsx)

## Pitfalls

- ECONNREFUSED on /api/news usually means cache server is not running.
- EADDRINUSE on port 4000 means a previous server process is still active.
- db.json must remain valid JSON; malformed edits will crash json-server startup.
- Repo-wide lint may be noisy because vendor assets are included.

## Validation Checklist for Agents

After cache-related edits:

1. Start dev stack with npm run dev.
2. Confirm server logs show GET /api/news requests.
3. Confirm [sb-admin-react/server/db.json](sb-admin-react/server/db.json) is populated under endpoint-derived collections.
4. Confirm dashboard renders headlines and does not fail on refresh.

## Related Docs

- Operational details and troubleshooting: [INSTRUCTIONS.md](INSTRUCTIONS.md)
- App-specific setup notes: [sb-admin-react/README.md](sb-admin-react/README.md)

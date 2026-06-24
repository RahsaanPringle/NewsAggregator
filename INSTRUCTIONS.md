# NewsAggregator Project Instructions

## Project Layout

- `sb-admin-react/`: Active React + Vite dashboard app.
- `startbootstrap-sb-admin-2-gh-pages/`: Upstream template source.
- `docs/`: Design and implementation notes.

## Local Development

Run all commands from `sb-admin-react/` unless noted.

### Install

```bash
npm install
```

### Start App (Recommended)

```bash
npm run dev
```

This starts both:

- Vite frontend (`http://localhost:5173` by default)
- Local JSON cache server (`http://127.0.0.1:4000`)

### Optional Scripts

```bash
npm run dev:client   # Vite only
npm run server       # Cache API only
npm run build        # Production build
npm run lint         # ESLint (includes vendor assets, may be noisy)
```

## Environment Variables

The cache server and app expect a RapidAPI key in one of these variables:

- `RAPIDAPI_KEY`
- `VITE_RAPIDAPI_KEY`

Use `.env.local` in `sb-admin-react/` for local development.

## Cache Data Flow

1. Browser requests `/api/news?...` from Vite app.
2. Vite proxies `/api/*` to `http://127.0.0.1:4000`.
3. JSON server checks cache in `sb-admin-react/server/db.json`.
4. If cache is missing or older than 24 hours, server calls RapidAPI.
5. Response is saved to `db.json` and returned to the UI.

## Cache Storage Format

Cache entries are grouped into endpoint-derived collections in `sb-admin-react/server/db.json`.

Examples:

- `rapid-api_topic-headlines`
- `rapid-api_full-story-coverage`

Each entry includes:

- `id` (endpoint + query key)
- `endpointPath`
- `queryParams`
- `payload`
- `fetchedAt`

## Troubleshooting

### `ECONNREFUSED 127.0.0.1:4000`

Cause: Vite is running but cache server is not.

Fix:

```bash
npm run dev
```

### `EADDRINUSE` on port `4000`

Cause: A previous server process is still running.

Fix on Windows PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 4000 -State Listen | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

### `Malformed JSON in server/db.json`

Cause: Cache file was manually edited into invalid JSON.

Fix:

1. Stop server.
2. Reset `sb-admin-react/server/db.json` to:

```json
{}
```

3. Restart with `npm run dev` (or `npm run server`) to repopulate.

## Git Identity (One-Time Setup)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

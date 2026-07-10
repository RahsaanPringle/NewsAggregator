# API Documentation and Hardening

This page summarizes the API documentation and hardening work around `News-Net-API`, Swagger, MySQL-backed routes, cache schema reliability, and secret handling.

## ASP.NET Core API Added To Workspace

The `News-Net-API/` project is present as an ASP.NET Core 8 API for the NewsAggregator dashboard. It provides server-side routes for:

- RapidAPI news requests through `/api/news`
- Cached and saved article views
- MySQL article status checks and inserts
- Comment users, article comments, and reply inbox data
- Dashboard cards such as hero articles, business news, world headlines, and news coverage

## Swagger UI

Swagger UI was added to `News-Net-API`.

- UI route: `/swagger`
- Raw OpenAPI route: `/openapi.json`
- Local HTTPS route: `https://localhost:7125/swagger`
- IIS/base-path route: `/NewsAPI/swagger`

The Swagger UI points at the existing hand-built OpenAPI JSON document.

## OpenAPI Improvements

The OpenAPI document now includes a required query parameter for:

- `GET /api/news`

Required query parameter:

```text
endpointPath
```

Example:

```text
/api/news?endpointPath=/business&lr=en-US
```

This prevents Swagger from generating an invalid `/api/news` request with no endpoint path.

## MySQL Configuration Guards

Several MySQL-backed dashboard routes now return clean JSON responses when MySQL is not configured instead of throwing unhandled exceptions.

Guarded routes include:

- `GET /api/hero-articles`
- `GET /api/business-news`
- `GET /api/world-headlines`
- `GET /api/news-coverage`

When MySQL is missing, these routes return a `503` response similar to:

```json
{
  "enabled": false,
  "items": [],
  "error": "MySQL is not configured."
}
```

## MySQL Cache Schema Fix

The `api_cache_entries` schema was updated to avoid MySQL's maximum key length limit.

Previous unique key:

```sql
UNIQUE KEY uq_api_cache_entries_lookup (api_source, endpoint_path, query_params_json(512))
```

Updated approach:

- Store the full query params JSON in `query_params_json`
- Store a SHA-256 hash in `query_params_hash`
- Use the fixed-length hash in the unique key

Updated unique key:

```sql
UNIQUE KEY uq_api_cache_entries_lookup (api_source, endpoint_path, query_params_hash)
```

This keeps full query JSON available for inspection while avoiding oversized UTF-8 indexes.

## Saved Article Query Param Parsing

Saved articles may contain query params where JSON values are strings, numbers, booleans, or nested values.

The article reader now parses `query_params_json` defensively and converts values to strings when returning `ArticleRecord`. This prevents errors such as:

```text
The JSON value could not be converted to System.String.
```

## Friendlier POST Body Validation

POST endpoints now handle missing request bodies more gracefully.

Updated endpoints include:

- `POST /api/mysql/articles/status`
- `POST /api/mysql/articles`
- `POST /api/articles/{articleHash}/comments`

Instead of framework-level developer exception pages, missing bodies now return `400` JSON errors.

Example valid request for article status:

```bash
curl -k -X POST "https://localhost:7125/api/mysql/articles/status" \
  -H "accept: */*" \
  -H "Content-Type: application/json" \
  -d "{\"articles\":[]}"
```

## Sensitive Files Ignored

The root `.gitignore` was updated to ignore local secrets and generated .NET files.

Ignored local config files include:

- `**/appsettings.Development.json`
- `**/appsettings.Production.json`
- `**/appsettings.Local.json`
- `**/appsettings.*.local.json`
- `.env` variants

Ignored local tooling and build files include:

- `**/.vs/`
- `*.csproj.user`
- `**/bin/`
- `**/obj/`
- `**/artifacts/`
- `**/publish/`

Trackable examples remain allowed:

- `appsettings.json`
- `appsettings.Production.example.json`

## Verification

Because the local API and Visual Studio can lock normal debug binaries, verification builds were run to a separate output folder:

```powershell
dotnet build News-Net-API.csproj -o .\artifacts\verify-build
```

The final verification build completed successfully with:

```text
0 warnings
0 errors
```

The temporary `artifacts\verify-build` folder was removed after verification.

## Operational Notes

Restart `News-Net-API` after code or configuration changes.

If a normal `dotnet build` fails because files are locked, stop the running API or Visual Studio debug session and build again.

If real credentials were ever committed, pushed, or shared, rotate the RapidAPI key and MySQL password.

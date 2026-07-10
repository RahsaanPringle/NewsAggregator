# NewsAggregator

NewsAggregator is a news dashboard project that collects, caches, displays, and stores article data from RapidAPI-backed news sources. The project includes a React dashboard, local development cache server, MySQL article storage, comment features, and an ASP.NET Core API intended for IIS deployment.

## Project Components

- `sb-admin-react/` - Active React + Vite dashboard application.
- `News-Net-API/` - ASP.NET Core 8 API for production-style news, cache, article, comment, and Swagger routes.
- `news-api/` - Earlier standalone Node + Express API with Swagger support.
- `docs/` - Planning notes, design documents, and business/feature references.
- `startbootstrap-sb-admin-2-gh-pages/` - Original dashboard template source.

## Main Data Flow

1. The dashboard requests news data through server-side API routes.
2. The API checks cached data before calling RapidAPI.
3. Fresh or cached news payloads are returned to the frontend.
4. Selected articles can be saved into MySQL.
5. Saved articles support comments, comment users, dashboard metrics, and related views.

## Local Development

For the React dashboard:

```bash
cd sb-admin-react
npm install
npm run dev
```

This starts the Vite frontend and the local cache server.

For the ASP.NET Core API:

```powershell
cd News-Net-API
dotnet build
dotnet run
```

Swagger UI is available at:

```text
https://localhost:7125/swagger
```

## Configuration

Secrets should not be committed. Use local config files or environment variables.

Common API settings:

- `RapidApiKey` or `RAPIDAPI_KEY`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

For `News-Net-API`, copy:

```text
appsettings.Production.example.json
```

to:

```text
appsettings.Production.json
```

and fill in the real production values on the server.

## Important API Routes

- `GET /health`
- `GET /swagger`
- `GET /openapi.json`
- `GET /api/news`
- `GET /api/hero-articles`
- `GET /api/business-news`
- `GET /api/world-headlines`
- `GET /api/news-coverage`
- `POST /api/mysql/articles/status`
- `POST /api/mysql/articles`
- `GET /api/articles`
- `GET /api/articles/{articleHash}`
- `GET /api/articles/{articleHash}/comments`
- `POST /api/articles/{articleHash}/comments`

## Deployment Notes

`News-Net-API` targets ASP.NET Core 8 and can be published for IIS:

```powershell
dotnet publish -c Release -o .\publish
```

Upload the publish output to the IIS `/NewsAPI` application directory. The host must support ASP.NET Core 8 through the ASP.NET Core Hosting Bundle.

## Troubleshooting

If `/api/news` returns:

```json
{ "error": "Query parameter endpointPath is required." }
```

include an endpoint path:

```text
/api/news?endpointPath=/business&lr=en-US
```

If MySQL-backed routes return configuration errors, confirm the MySQL settings are present and restart the API.

If build output is locked, stop the running API or Visual Studio debug session before rebuilding.

## Repository

GitHub repository:

https://github.com/RahsaanPringle/NewsAggregator

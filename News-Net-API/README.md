# News-Net-API

ASP.NET Core replacement for the Node `news-api` and cache server routes used by the NewsAggregator React dashboard.

## Routes

- `GET /health`
- `GET /openapi.json`
- `GET /swagger`
- `GET /api/news`
- `GET /api/hero-articles`
- `GET /api/business-news`
- `GET /api/world-headlines`
- `GET /api/news-coverage`
- `GET /api/mysql/articles/collected-today`
- `GET /api/mysql/articles/saved-by-day`
- `GET /api/mysql/articles/source-distribution`
- `GET /api/mysql/comments/revenue`
- `GET /api/mysql/comments/with-responses`
- `GET /api/mysql/comments/without-responses`
- `POST /api/mysql/articles/status`
- `POST /api/mysql/articles`
- `GET /api/mysql/articles`
- `GET /api/articles`
- `GET /api/articles/{articleHash}`
- `GET /api/articles/{articleHash}/comments`
- `POST /api/articles/{articleHash}/comments`
- `POST /api/comment-users/random`
- `GET /api/comment-users/{commentUserId}`
- `GET /api/comment-messages/inbox`

## Configuration

Copy `appsettings.Production.example.json` to `appsettings.Production.json` on the server and fill in:

- `RapidApiKey`
- `MySql:Database`
- `MySql:User`
- `MySql:Password`
- `MySql:MaximumPoolSize` (optional; defaults to `10`)
- `CorsOrigins`

The API can also read equivalent environment variables:

- `RAPIDAPI_KEY`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_MAXIMUM_POOL_SIZE`

## Local Build

```powershell
dotnet build
```

## Publish For IIS

```powershell
dotnet publish -c Release -o .\publish
```

Upload everything in `publish` to the IIS `/NewsAPI` application directory.

The server must support ASP.NET Core 8 through the ASP.NET Core Hosting Bundle. If the host only supports classic ASP.NET/.NET Framework, this project will need to be retargeted to Web API 2.

## Frontend

Build the React app with:

```powershell
cd ..\sb-admin-react
npm run build:news
```

That build points API calls at `/NewsAPI`, so the browser calls this ASP.NET Core app on the same IIS site.

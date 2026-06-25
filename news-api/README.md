# News API

Standalone Node + Express API for the NewsAggregator project.

## What it does

- Checks whether articles already exist in MySQL.
- Saves missing articles into MySQL.
- Lists saved articles for inspection.
- Serves Swagger UI at `/docs`.

## Environment

Create a `.env.local` file from `.env.example` and set:

- `PORT` - optional, defaults to `4001`
- `MYSQL_HOST`
- `MYSQL_PORT` - optional, defaults to `3306`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `CORS_ORIGIN` - optional comma-separated list of allowed origins

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

For production:

```bash
npm start
```

Swagger UI:

- `http://localhost:4001/docs`

Raw spec:

- `http://localhost:4001/openapi.json`

## Database Setup

Run `sql/create_news_articles_table.sql` in your MySQL database before first use.

## IIS / Hosting Notes

If you want `https://NewsAPI.YubTub.club`, run this Node service on the server and place IIS in front of it as a reverse proxy. The API itself stays Node-based, so the frontend never talks to MySQL directly.

# WebSpider

WebSpider is a .NET 8 console worker that enriches saved news articles with their downloaded HTML and extracted text.

## Processing contract

1. Connect to the same MySQL database configured in `../news-api/.env.local`.
2. Create `article_data` if it does not exist.
3. Randomly select one row from `news_articles` that has no linked `article_data` row.
4. Download its HTML and extract readable text.
5. Store both values in `article_data`, linked by `article_id`.

A linked `article_data` row is the processed marker. Failed downloads do not create a row and remain eligible for a later retry.

## Run

```powershell
dotnet run --project .\WebSpider\WebSpider.csproj -- --once
```

Omit `--once` to run continuously. The default delay between passes is 10 seconds.

Options:

- `--env <path>`: use a different `.env.local` file.
- `--delay-seconds <number>`: continuous-mode delay.
- `--timeout-seconds <number>`: HTTP request timeout.
- `--user-agent <value>`: HTTP User-Agent header.

The environment file must contain `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD`.

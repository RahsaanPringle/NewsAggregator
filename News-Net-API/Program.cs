using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using MySqlConnector;
using static ApiHelpers;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var configuredOrigins = builder.Configuration["CorsOrigins"];
        if (string.IsNullOrWhiteSpace(configuredOrigins))
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
            return;
        }

        policy.WithOrigins(configuredOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddHttpClient();
builder.Services.AddSingleton<NewsApiConfig>();
builder.Services.AddScoped<NewsRepository>();
builder.Services.AddScoped<RapidNewsService>();

var app = builder.Build();

app.UseCors();
app.Use(async (context, next) =>
{
    var basePath = app.Services.GetRequiredService<NewsApiConfig>().DeploymentBasePath;
    if (!string.IsNullOrWhiteSpace(basePath) && context.Request.Path.StartsWithSegments(basePath, out var remainder))
    {
        context.Request.PathBase = basePath;
        context.Request.Path = remainder.HasValue ? remainder : "/";
    }

    await next();
});

app.UseSwaggerUI(options =>
{
    options.DocumentTitle = "News-Net-API Swagger";
    options.RoutePrefix = "swagger";
    options.SwaggerEndpoint("../openapi.json", "News .NET API v0.1.0");
});

app.MapGet("/", () => Results.Json(new { name = "News-Net-API", status = "ok" }));
app.MapGet("/health", () => Results.Json(new { status = "ok" }));
app.MapGet("/openapi.json", (HttpContext context) => Results.Json(OpenApiDocument.Build(context)));

app.MapGet("/api/news", async (HttpRequest request, RapidNewsService rapidNews) =>
{
    var endpointPath = NormalizeEndpointPath(request.Query["endpointPath"].FirstOrDefault());
    if (string.IsNullOrWhiteSpace(endpointPath))
    {
        return Results.BadRequest(new { error = "Query parameter endpointPath is required." });
    }

    var queryParams = QueryToDictionary(request.Query, "endpointPath");
    var payload = await rapidNews.GetCachedOrFreshPayloadAsync(endpointPath, queryParams);
    return Results.Json(payload);
});

app.MapGet("/api/hero-articles", async (HttpRequest request, NewsRepository repository) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { enabled = false, items = Array.Empty<object>(), error = "MySQL is not configured." }, statusCode: 503);
    }

    var limit = ClampInt(request.Query["limit"].FirstOrDefault(), 5, 1, 12);
    var poolLimit = ClampInt(request.Query["poolLimit"].FirstOrDefault(), 80, limit, 500);
    var items = await repository.ListNewestRandomCachedArticlesAsync(limit, poolLimit);
    return Results.Json(new { enabled = true, source = "database", selection = "newest-randomized", items });
});

app.MapGet("/api/business-news", async (NewsRepository repository, RapidNewsService rapidNews) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { enabled = false, items = Array.Empty<object>(), error = "MySQL is not configured." }, statusCode: 503);
    }

    var queryParams = new Dictionary<string, string> { ["lr"] = "en-US" };
    return await SyncAndListEndpointArticles(repository, rapidNews, "/business", queryParams);
});

app.MapGet("/api/world-headlines", async (NewsRepository repository, RapidNewsService rapidNews) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { enabled = false, items = Array.Empty<object>(), error = "MySQL is not configured." }, statusCode: 503);
    }

    var queryParams = new Dictionary<string, string> { ["topic"] = "WORLD", ["limit"] = "500", ["country"] = "US", ["lang"] = "en" };
    return await SyncAndListEndpointArticles(repository, rapidNews, "/topic-headlines", queryParams);
});

app.MapGet("/api/news-coverage", async (NewsRepository repository, RapidNewsService rapidNews) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { enabled = false, items = Array.Empty<object>(), error = "MySQL is not configured." }, statusCode: 503);
    }

    var queryParams = new Dictionary<string, string>
    {
        ["story"] = "CAAqNggKIjBDQklTSGpvSmMzUnZjbmt0TXpZd1NoRUtEd2pibk5UN0VCSDVpWndxM3pJc0hDZ0FQAQ",
        ["sort"] = "RELEVANCE",
        ["country"] = "US",
        ["lang"] = "en",
    };
    return await SyncAndListEndpointArticles(repository, rapidNews, "/full-story-coverage", queryParams);
});

async Task<IResult> SyncAndListEndpointArticles(
    NewsRepository repository,
    RapidNewsService rapidNews,
    string endpointPath,
    Dictionary<string, string> queryParams)
{
    try
    {
        var payload = await rapidNews.GetCachedOrFreshPayloadAsync(endpointPath, queryParams);
        var articles = NormalizeRapidNewsArticles(payload);
        var sync = await repository.SaveArticlesAsync(articles, endpointPath, queryParams);
        var items = await repository.ListRandomArticlesByEndpointAsync(endpointPath, 9);
        return Results.Json(new { enabled = true, source = "database", synced = sync, items });
    }
    catch (Exception exception)
    {
        var items = await repository.ListRandomArticlesByEndpointAsync(endpointPath, 9);
        return Results.Json(new
        {
            enabled = true,
            source = "database-fallback",
            synced = new SyncStatus(0, 0, 0, "failed"),
            items,
            warning = exception.Message,
        });
    }
}

app.MapGet("/api/mysql/articles/collected-today", async (NewsRepository repository) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { enabled = false, count = 0, message = "MySQL is not configured." });
    }

    return Results.Json(new { enabled = true, count = await repository.CountArticlesCollectedTodayAsync() });
});

app.MapGet("/api/mysql/articles/saved-by-day", async (HttpRequest request, NewsRepository repository) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { enabled = false, totalSaved = 0, items = Array.Empty<object>(), message = "MySQL is not configured." });
    }

    var days = ClampInt(request.Query["days"].FirstOrDefault(), 7, 1, 31);
    var result = await repository.ListArticlesSavedByDayAsync(days);
    return Results.Json(new { enabled = true, result.totalSaved, items = result.items });
});

app.MapGet("/api/mysql/articles/source-distribution", async (HttpRequest request, NewsRepository repository) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { enabled = false, totalArticles = 0, items = Array.Empty<object>(), message = "MySQL is not configured." });
    }

    var limit = ClampInt(request.Query["limit"].FirstOrDefault(), 4, 1, 20);
    var result = await repository.ListSourceDistributionAsync(limit);
    return Results.Json(new { enabled = true, result.totalArticles, items = result.items });
});

app.MapGet("/api/mysql/comments/revenue", async (NewsRepository repository) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { enabled = false, revenue = 0, message = "MySQL is not configured." });
    }

    var count = await repository.CountPublishedCommentsAsync();
    return Results.Json(new { enabled = true, comments = count, revenue = count });
});

app.MapGet("/api/mysql/comments/with-responses", async (NewsRepository repository) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { enabled = false, count = 0, message = "MySQL is not configured." });
    }

    return Results.Json(new { enabled = true, count = await repository.CountCommentsWithResponsesAsync() });
});

app.MapGet("/api/mysql/comments/without-responses", async (NewsRepository repository) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { enabled = false, count = 0, message = "MySQL is not configured." });
    }

    return Results.Json(new { enabled = true, count = await repository.CountCommentsWithoutResponsesAsync() });
});

app.MapPost("/api/mysql/articles/status", async (ArticleStatusRequest? body, NewsRepository repository) =>
{
    if (body is null)
    {
        return Results.BadRequest(new { error = "Request body must include an articles array." });
    }

    var articles = body.Articles ?? [];
    var articleHashes = articles.Select(ComputeArticleHash).ToArray();

    if (!repository.IsConfigured)
    {
        return Results.Json(new
        {
            enabled = false,
            message = "MySQL is not configured.",
            articleHashes = Array.Empty<string>(),
            existingArticleHashes = Array.Empty<string>(),
        });
    }

    var existingArticleHashes = await repository.FindExistingArticleHashesAsync(articleHashes);
    return Results.Json(new { enabled = true, articleHashes, existingArticleHashes });
});

app.MapPost("/api/mysql/articles", async (SaveArticleRequest? body, NewsRepository repository) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { error = "MySQL is not configured." }, statusCode: 503);
    }

    if (body?.Article is null)
    {
        return Results.BadRequest(new { error = "Request body must include an article object." });
    }

    var result = await repository.SaveArticleAsync(body.Article, body.EndpointPath, body.QueryParams ?? new Dictionary<string, string>());
    return Results.Json(result, statusCode: result.inserted ? 201 : 200);
});

app.MapGet("/api/mysql/articles", ListArticles);
app.MapGet("/api/articles", ListArticles);

async Task<IResult> ListArticles(HttpRequest request, NewsRepository repository)
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { error = "MySQL is not configured." }, statusCode: 503);
    }

    var limit = ClampInt(request.Query["limit"].FirstOrDefault(), 50, 1, 500);
    var offset = ClampInt(request.Query["offset"].FirstOrDefault(), 0, 0, 1_000_000);
    var search = NormalizeNullableString(request.Query["search"].FirstOrDefault());
    var result = await repository.ListArticlesAsync(limit, offset, search);
    return Results.Json(new { items = result.items, limit, offset, total = result.total });
}

app.MapGet("/api/articles/{articleHash}", async (string articleHash, HttpRequest request, NewsRepository repository) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { error = "MySQL is not configured." }, statusCode: 503);
    }

    var article = await repository.FindArticleByHashAsync(articleHash);
    if (article is null)
    {
        return Results.NotFound(new { error = "Article not found." });
    }

    if (request.Query.ContainsKey("relatedLimit"))
    {
        var limit = ClampInt(request.Query["relatedLimit"].FirstOrDefault(), 5, 0, 20);
        var relatedItems = await repository.ListRelatedArticlesAsync(articleHash, article.SourceName, limit);
        return Results.Json(new { item = article, relatedItems });
    }

    return Results.Json(article);
});

app.MapGet("/api/articles/{articleHash}/comments", async (string articleHash, NewsRepository repository) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { error = "MySQL is not configured." }, statusCode: 503);
    }

    var article = await repository.FindArticleInternalIdAsync(articleHash);
    if (article is null)
    {
        return Results.NotFound(new { error = "Article not found." });
    }

    var comments = await repository.ListArticleCommentsAsync(article.Id);
    return Results.Json(new { article_hash = article.ArticleHash, items = comments });
});

app.MapPost("/api/articles/{articleHash}/comments", async (string articleHash, CreateCommentRequest? body, NewsRepository repository, IHttpClientFactory httpClientFactory, HttpContext context) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { error = "MySQL is not configured." }, statusCode: 503);
    }

    if (body is null)
    {
        return Results.BadRequest(new { error = "Request body must include a non-empty comment body." });
    }

    var commentBody = NormalizeNullableString(body.Body);
    if (string.IsNullOrWhiteSpace(commentBody))
    {
        return Results.BadRequest(new { error = "Request body must include a non-empty comment body." });
    }

    var article = await repository.FindArticleInternalIdAsync(articleHash);
    if (article is null)
    {
        return Results.NotFound(new { error = "Article not found." });
    }

    var userId = body.CommentUserId is > 0
        ? body.CommentUserId.Value
        : await repository.FindOrCreateCommentUserAsync(httpClientFactory.CreateClient(), GetRequestIpAddress(context), body.Location, body.Consent);

    var created = await repository.CreateArticleCommentAsync(article.Id, article.ArticleHash, userId, body.ParentCommentId, commentBody);
    return Results.Json(created, statusCode: 201);
});

app.MapPost("/api/comment-users/random", async (NewsRepository repository, IHttpClientFactory httpClientFactory) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { error = "MySQL is not configured." }, statusCode: 503);
    }

    var user = await repository.CreateRandomCommentUserAsync(httpClientFactory.CreateClient());
    return Results.Json(user, statusCode: 201);
});

app.MapGet("/api/comment-users/{commentUserId:int}", async (int commentUserId, NewsRepository repository) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { error = "MySQL is not configured." }, statusCode: 503);
    }

    var user = await repository.FindCommentUserAsync(commentUserId);
    return user is null ? Results.NotFound(new { error = "Comment user not found." }) : Results.Json(user);
});

app.MapGet("/api/comment-messages/inbox", async (HttpRequest request, NewsRepository repository) =>
{
    if (!repository.IsConfigured)
    {
        return Results.Json(new { error = "MySQL is not configured." }, statusCode: 503);
    }

    var commentUserId = ClampInt(request.Query["commentUserId"].FirstOrDefault(), 0, 0, int.MaxValue);
    if (commentUserId <= 0)
    {
        return Results.BadRequest(new { error = "Query parameter commentUserId must be a positive integer." });
    }

    var limit = ClampInt(request.Query["limit"].FirstOrDefault(), 10, 1, 50);
    var result = await repository.ListCommentMessagesAsync(commentUserId, limit);
    return Results.Json(new { comment_user_id = commentUserId, result.total, result.unread_total, items = result.items });
});

app.Run();

public static class ApiHelpers
{
    public static Dictionary<string, string> QueryToDictionary(IQueryCollection query, params string[] excludedKeys)
    {
        var excluded = excludedKeys.ToHashSet(StringComparer.OrdinalIgnoreCase);
        return query
            .Where(item => !excluded.Contains(item.Key) && !string.IsNullOrWhiteSpace(item.Value.FirstOrDefault()))
            .ToDictionary(item => item.Key, item => item.Value.First()!, StringComparer.OrdinalIgnoreCase);
    }

    public static string NormalizeEndpointPath(string? value)
    {
        var normalized = NormalizeNullableString(value);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return "";
        }

        return normalized.StartsWith('/') ? normalized : $"/{normalized}";
    }

    public static string? NormalizeNullableString(object? value, int maxLength = 65_535)
    {
        if (value is null)
        {
            return null;
        }

        var normalized = Convert.ToString(value)?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return null;
        }

        return normalized.Length > maxLength ? normalized[..maxLength] : normalized;
    }

    public static int ClampInt(string? value, int defaultValue, int min, int max)
    {
        return int.TryParse(value, out var parsed) ? Math.Min(max, Math.Max(min, parsed)) : defaultValue;
    }

    public static List<JsonObject> NormalizeRapidNewsArticles(JsonNode? payload)
    {
        var candidates = new[]
        {
            payload?["data"] as JsonArray,
            payload?["data"]?["top_news"]?["all_articles"] as JsonArray,
            payload?["data"]?["all_articles"] as JsonArray,
        };

        return candidates.FirstOrDefault(array => array is not null)?
            .OfType<JsonObject>()
            .Select(article => article.DeepClone().AsObject())
            .ToList() ?? [];
    }

    public static string ComputeArticleHash(JsonObject article)
    {
        var payload = new
        {
            articleId = NormalizeNullableString(article["article_id"]?.GetValue<object>()),
            title = NormalizeNullableString(article["title"]?.GetValue<object>()),
            link = NormalizeNullableString(article["link"]?.GetValue<object>()),
            snippet = NormalizeNullableString(article["snippet"]?.GetValue<object>()),
            sourceName = NormalizeNullableString(article["source_name"]?.GetValue<object>()),
            publishedDatetimeUtc = NormalizeNullableString(article["published_datetime_utc"]?.GetValue<object>()),
            authors = article["authors"] is JsonArray authors
                ? authors.Select(author => NormalizeNullableString(author?.GetValue<object>())).Where(author => !string.IsNullOrWhiteSpace(author)).ToArray()
                : [],
        };

        var json = JsonSerializer.Serialize(payload);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json))).ToLowerInvariant();
    }

    public static string GetRequestIpAddress(HttpContext context)
    {
        var forwarded = NormalizeNullableString(context.Request.Headers["x-forwarded-for"].FirstOrDefault());
        var candidate = forwarded?.Split(',')[0] ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return candidate.Replace("::ffff:", "", StringComparison.OrdinalIgnoreCase);
    }
}

public sealed class NewsApiConfig(IConfiguration configuration)
{
    public string DeploymentBasePath { get; } = NormalizeBasePath(configuration["DeploymentBasePath"] ?? "/NewsAPI");
    public string RapidApiKey { get; } = configuration["RapidApiKey"] ?? configuration["RAPIDAPI_KEY"] ?? configuration["VITE_RAPIDAPI_KEY"] ?? "";
    public string MySqlConnectionString { get; } = BuildConnectionString(configuration);
    public TimeSpan CacheTtl { get; } = TimeSpan.FromHours(double.TryParse(configuration["CacheTtlHours"], out var hours) ? hours : 24);

    private static string NormalizeBasePath(string value)
    {
        var normalized = value.Trim();
        if (string.IsNullOrWhiteSpace(normalized) || normalized == "/")
        {
            return "";
        }

        return $"/{normalized.Trim('/')}";
    }

    private static string BuildConnectionString(IConfiguration configuration)
    {
        var direct = configuration.GetConnectionString("NewsDatabase");
        if (!string.IsNullOrWhiteSpace(direct))
        {
            return direct;
        }

        var host = configuration["MYSQL_HOST"] ?? configuration["MySql:Host"] ?? "my04.winhost.com";
        var port = configuration["MYSQL_PORT"] ?? configuration["MySql:Port"] ?? "3306";
        var database = configuration["MYSQL_DATABASE"] ?? configuration["MySql:Database"];
        var user = configuration["MYSQL_USER"] ?? configuration["MySql:User"];
        var password = configuration["MYSQL_PASSWORD"] ?? configuration["MySql:Password"];

        return string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(database) || string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(password)
            ? ""
            : $"Server={host};Port={port};Database={database};User ID={user};Password={password};Charset=utf8mb4;Allow User Variables=true;";
    }
}

public sealed class RapidNewsService(NewsApiConfig config, NewsRepository repository, IHttpClientFactory httpClientFactory)
{
    private const string RapidApiHost = "real-time-news-data.p.rapidapi.com";
    private const string GoogleNewsHost = "google-news13.p.rapidapi.com";

    public async Task<JsonNode?> GetCachedOrFreshPayloadAsync(string endpointPath, Dictionary<string, string> queryParams)
    {
        var cached = await repository.FindFreshCacheEntryAsync("rapidApi", endpointPath, queryParams, config.CacheTtl);
        if (cached is not null)
        {
            return cached;
        }

        if (string.IsNullOrWhiteSpace(config.RapidApiKey))
        {
            throw new InvalidOperationException("Missing RapidAPI key. Set RapidApiKey, RAPIDAPI_KEY, or VITE_RAPIDAPI_KEY.");
        }

        var payload = await FetchFromRapidApiAsync(endpointPath, queryParams);
        await repository.SaveCacheEntryAsync("rapidApi", endpointPath, queryParams, payload);
        return payload;
    }

    private async Task<JsonNode?> FetchFromRapidApiAsync(string endpointPath, Dictionary<string, string> queryParams)
    {
        var host = endpointPath.Equals("/business", StringComparison.OrdinalIgnoreCase) ? GoogleNewsHost : RapidApiHost;
        var uriBuilder = new UriBuilder("https", host) { Path = endpointPath.TrimStart('/') };
        var query = string.Join("&", queryParams.Select(item => $"{Uri.EscapeDataString(item.Key)}={Uri.EscapeDataString(item.Value)}"));
        uriBuilder.Query = query;

        using var request = new HttpRequestMessage(HttpMethod.Get, uriBuilder.Uri);
        request.Headers.Add("x-rapidapi-host", host);
        request.Headers.Add("x-rapidapi-key", config.RapidApiKey);

        using var response = await httpClientFactory.CreateClient().SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"RapidAPI request failed with status {(int)response.StatusCode}: {body}");
        }

        return JsonNode.Parse(body);
    }
}

public sealed class NewsRepository(NewsApiConfig config)
{
    public bool IsConfigured => !string.IsNullOrWhiteSpace(config.MySqlConnectionString);

    private async Task<MySqlConnection> OpenConnectionAsync()
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("MySQL is not configured.");
        }

        var connection = new MySqlConnection(config.MySqlConnectionString);
        await connection.OpenAsync();
        return connection;
    }

    private async Task EnsureSchemaAsync(MySqlConnection connection)
    {
        foreach (var statement in SchemaStatements.All)
        {
            await using var command = new MySqlCommand(statement, connection);
            await command.ExecuteNonQueryAsync();
        }
    }

    public async Task<JsonNode?> FindFreshCacheEntryAsync(string apiSource, string endpointPath, Dictionary<string, string> queryParams, TimeSpan ttl)
    {
        if (!IsConfigured)
        {
            return null;
        }

        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        await using var command = new MySqlCommand(
            @"SELECT payload_json, fetched_at
              FROM api_cache_entries
              WHERE api_source = @api_source
                AND endpoint_path = @endpoint_path
                AND query_params_hash = @query_params_hash
                AND query_params_json = @query_params_json
              LIMIT 1",
            connection);
        command.Parameters.AddWithValue("@api_source", apiSource);
        command.Parameters.AddWithValue("@endpoint_path", endpointPath);
        var queryParamsJson = StableJson(queryParams);
        command.Parameters.AddWithValue("@query_params_hash", StableHash(queryParamsJson));
        command.Parameters.AddWithValue("@query_params_json", queryParamsJson);

        await using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return null;
        }

        var fetchedAt = reader.GetDateTime("fetched_at");
        if (DateTime.UtcNow - fetchedAt.ToUniversalTime() >= ttl)
        {
            return null;
        }

        return JsonNode.Parse(reader.GetString("payload_json"));
    }

    public async Task SaveCacheEntryAsync(string apiSource, string endpointPath, Dictionary<string, string> queryParams, JsonNode? payload)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        await using var command = new MySqlCommand(
            @"INSERT INTO api_cache_entries (api_source, endpoint_path, query_params_json, query_params_hash, payload_json, fetched_at)
              VALUES (@api_source, @endpoint_path, @query_params_json, @query_params_hash, @payload_json, UTC_TIMESTAMP())
              ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json), fetched_at = UTC_TIMESTAMP()",
            connection);
        command.Parameters.AddWithValue("@api_source", apiSource);
        command.Parameters.AddWithValue("@endpoint_path", endpointPath);
        var queryParamsJson = StableJson(queryParams);
        command.Parameters.AddWithValue("@query_params_json", queryParamsJson);
        command.Parameters.AddWithValue("@query_params_hash", StableHash(queryParamsJson));
        command.Parameters.AddWithValue("@payload_json", payload?.ToJsonString() ?? "{}");
        await command.ExecuteNonQueryAsync();
    }

    public async Task<SyncStatus> SaveArticlesAsync(IEnumerable<JsonObject> articles, string endpointPath, Dictionary<string, string> queryParams)
    {
        var attempted = 0;
        var inserted = 0;
        var updated = 0;

        foreach (var article in articles)
        {
            attempted += 1;
            var result = await SaveArticleAsync(article, endpointPath, queryParams);
            if (result.inserted)
            {
                inserted += 1;
            }
            else
            {
                updated += 1;
            }
        }

        return new SyncStatus(attempted, inserted, updated, "complete");
    }

    public async Task<(string articleHash, bool inserted, bool alreadyExists)> SaveArticleAsync(JsonObject article, string? endpointPath, Dictionary<string, string> queryParams)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);

        var articleHash = ComputeArticleHash(article);
        await using var command = new MySqlCommand(
            @"INSERT INTO news_articles (
                article_hash, article_id, title, link, snippet, source_name, published_datetime_utc,
                authors_json, endpoint_path, query_params_json, raw_article_json
              ) VALUES (
                @article_hash, @article_id, @title, @link, @snippet, @source_name, @published_datetime_utc,
                @authors_json, @endpoint_path, @query_params_json, @raw_article_json
              )
              ON DUPLICATE KEY UPDATE updated_at = updated_at",
            connection);

        command.Parameters.AddWithValue("@article_hash", articleHash);
        command.Parameters.AddWithValue("@article_id", DbValue(NormalizeNullableString(article["article_id"]?.GetValue<object>(), 191)));
        command.Parameters.AddWithValue("@title", DbValue(NormalizeNullableString(article["title"]?.GetValue<object>())));
        command.Parameters.AddWithValue("@link", DbValue(NormalizeNullableString(article["link"]?.GetValue<object>())));
        command.Parameters.AddWithValue("@snippet", DbValue(NormalizeNullableString(article["snippet"]?.GetValue<object>())));
        command.Parameters.AddWithValue("@source_name", DbValue(NormalizeNullableString(article["source_name"]?.GetValue<object>(), 191)));
        command.Parameters.AddWithValue("@published_datetime_utc", DbValue(ParseArticlePublishedDate(article["published_datetime_utc"]?.GetValue<object>())));
        command.Parameters.AddWithValue("@authors_json", article["authors"]?.ToJsonString() ?? "[]");
        command.Parameters.AddWithValue("@endpoint_path", DbValue(NormalizeNullableString(endpointPath, 255)));
        command.Parameters.AddWithValue("@query_params_json", StableJson(queryParams));
        command.Parameters.AddWithValue("@raw_article_json", article.ToJsonString());

        var affected = await command.ExecuteNonQueryAsync();
        return (articleHash, inserted: affected == 1, alreadyExists: affected != 1);
    }

    public async Task<string[]> FindExistingArticleHashesAsync(IEnumerable<string> articleHashes)
    {
        var hashes = articleHashes.Where(hash => !string.IsNullOrWhiteSpace(hash)).Distinct().ToArray();
        if (hashes.Length == 0)
        {
            return [];
        }

        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        var placeholders = hashes.Select((_, index) => $"@hash{index}").ToArray();
        await using var command = new MySqlCommand($"SELECT article_hash FROM news_articles WHERE article_hash IN ({string.Join(", ", placeholders)})", connection);
        for (var index = 0; index < hashes.Length; index += 1)
        {
            command.Parameters.AddWithValue(placeholders[index], hashes[index]);
        }

        var results = new List<string>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add(reader.GetString("article_hash"));
        }

        return results.ToArray();
    }

    public async Task<List<ArticleRecord>> ListNewestRandomCachedArticlesAsync(int limit, int poolLimit)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        await using var command = new MySqlCommand(
            @"SELECT * FROM news_articles
              ORDER BY COALESCE(published_datetime_utc, created_at) DESC
              LIMIT @poolLimit",
            connection);
        command.Parameters.AddWithValue("@poolLimit", poolLimit);
        return (await ReadArticlesAsync(command)).OrderBy(_ => Guid.NewGuid()).Take(limit).ToList();
    }

    public async Task<List<ArticleRecord>> ListRandomArticlesByEndpointAsync(string endpointPath, int limit)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        await using var command = new MySqlCommand(
            @"SELECT * FROM news_articles
              WHERE endpoint_path = @endpoint_path
              ORDER BY RAND()
              LIMIT @limit",
            connection);
        command.Parameters.AddWithValue("@endpoint_path", endpointPath);
        command.Parameters.AddWithValue("@limit", limit);
        return await ReadArticlesAsync(command);
    }

    public async Task<(List<ArticleRecord> items, int total)> ListArticlesAsync(int limit, int offset, string? search)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        var whereClause = string.IsNullOrWhiteSpace(search) ? "" : "WHERE title LIKE @search OR snippet LIKE @search OR source_name LIKE @search OR link LIKE @search";
        await using var countCommand = new MySqlCommand($"SELECT COUNT(*) FROM news_articles {whereClause}", connection);
        if (!string.IsNullOrWhiteSpace(search))
        {
            countCommand.Parameters.AddWithValue("@search", $"%{search}%");
        }
        var total = Convert.ToInt32(await countCommand.ExecuteScalarAsync());

        await using var listCommand = new MySqlCommand(
            $@"SELECT * FROM news_articles
               {whereClause}
               ORDER BY created_at DESC
               LIMIT @limit OFFSET @offset",
            connection);
        if (!string.IsNullOrWhiteSpace(search))
        {
            listCommand.Parameters.AddWithValue("@search", $"%{search}%");
        }
        listCommand.Parameters.AddWithValue("@limit", limit);
        listCommand.Parameters.AddWithValue("@offset", offset);
        return (await ReadArticlesAsync(listCommand), total);
    }

    public async Task<ArticleRecord?> FindArticleByHashAsync(string articleHash)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        await using var command = new MySqlCommand("SELECT * FROM news_articles WHERE article_hash = @article_hash LIMIT 1", connection);
        command.Parameters.AddWithValue("@article_hash", articleHash);
        return (await ReadArticlesAsync(command)).FirstOrDefault();
    }

    public async Task<List<ArticleRecord>> ListRelatedArticlesAsync(string articleHash, string? sourceName, int limit)
    {
        if (limit <= 0)
        {
            return [];
        }

        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        var sameSource = !string.IsNullOrWhiteSpace(sourceName);
        await using var command = new MySqlCommand(
            $@"SELECT * FROM news_articles
               WHERE article_hash <> @article_hash {(sameSource ? "AND source_name = @source_name" : "")}
               ORDER BY COALESCE(published_datetime_utc, created_at) DESC
               LIMIT @limit",
            connection);
        command.Parameters.AddWithValue("@article_hash", articleHash);
        command.Parameters.AddWithValue("@limit", limit);
        if (sameSource)
        {
            command.Parameters.AddWithValue("@source_name", sourceName);
        }
        return await ReadArticlesAsync(command);
    }

    public async Task<ArticleInternalId?> FindArticleInternalIdAsync(string articleHash)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        await using var command = new MySqlCommand("SELECT id, article_hash FROM news_articles WHERE article_hash = @article_hash LIMIT 1", connection);
        command.Parameters.AddWithValue("@article_hash", articleHash);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? new ArticleInternalId(reader.GetInt32("id"), reader.GetString("article_hash")) : null;
    }

    public async Task<int> CountArticlesCollectedTodayAsync() => await CountScalarAsync("SELECT COUNT(*) FROM news_articles WHERE DATE(created_at) = UTC_DATE()");
    public async Task<int> CountPublishedCommentsAsync() => await CountScalarAsync("SELECT COUNT(*) FROM article_comments WHERE deleted_at IS NULL AND status = 'published'");
    public async Task<int> CountCommentsWithResponsesAsync() => await CountScalarAsync(@"SELECT COUNT(DISTINCT parent.id) FROM article_comments parent INNER JOIN article_comments response ON response.parent_comment_id = parent.id WHERE parent.deleted_at IS NULL AND parent.status = 'published' AND response.deleted_at IS NULL AND response.status = 'published'");
    public async Task<int> CountCommentsWithoutResponsesAsync() => await CountScalarAsync(@"SELECT COUNT(*) FROM article_comments parent WHERE parent.deleted_at IS NULL AND parent.status = 'published' AND parent.parent_comment_id IS NULL AND NOT EXISTS (SELECT 1 FROM article_comments response WHERE response.parent_comment_id = parent.id AND response.deleted_at IS NULL AND response.status = 'published')");

    private async Task<int> CountScalarAsync(string sql)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        await using var command = new MySqlCommand(sql, connection);
        return Convert.ToInt32(await command.ExecuteScalarAsync());
    }

    public async Task<(int totalSaved, List<object> items)> ListArticlesSavedByDayAsync(int days)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        await using var command = new MySqlCommand(
            @"SELECT DATE(created_at) AS saved_date, COUNT(*) AS count
              FROM news_articles
              WHERE created_at >= DATE_SUB(UTC_DATE(), INTERVAL @days - 1 DAY)
              GROUP BY DATE(created_at)
              ORDER BY saved_date ASC",
            connection);
        command.Parameters.AddWithValue("@days", days);
        var items = new List<object>();
        var total = 0;
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var count = reader.GetInt32("count");
            total += count;
            items.Add(new { date = reader.GetDateTime("saved_date").ToString("yyyy-MM-dd"), count });
        }
        return (total, items);
    }

    public async Task<(int totalArticles, List<object> items)> ListSourceDistributionAsync(int limit)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        var total = await CountScalarAsync("SELECT COUNT(*) FROM news_articles");
        await using var command = new MySqlCommand(
            @"SELECT COALESCE(NULLIF(source_name, ''), 'Unknown source') AS source_name, COUNT(*) AS count
              FROM news_articles
              GROUP BY COALESCE(NULLIF(source_name, ''), 'Unknown source')
              ORDER BY count DESC
              LIMIT @limit",
            connection);
        command.Parameters.AddWithValue("@limit", limit);
        var items = new List<object>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            items.Add(new { sourceName = reader.GetString("source_name"), count = reader.GetInt32("count") });
        }
        return (total, items);
    }

    public async Task<List<CommentRecord>> ListArticleCommentsAsync(int articleId)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        await using var command = new MySqlCommand(
            @"SELECT c.id, c.parent_comment_id, c.body, c.status, c.created_at, c.updated_at,
                     u.id AS user_id, u.display_name, u.username, u.profile_thumbnail_mime,
                     u.profile_thumbnail_blob, u.raw_profile_json
              FROM article_comments c
              INNER JOIN comment_users u ON u.id = c.comment_user_id
              WHERE c.article_id = @article_id AND c.deleted_at IS NULL AND c.status = 'published'
              ORDER BY c.created_at ASC",
            connection);
        command.Parameters.AddWithValue("@article_id", articleId);
        var items = new List<CommentRecord>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            items.Add(ReadComment(reader));
        }
        return items;
    }

    public async Task<int> FindOrCreateCommentUserAsync(HttpClient httpClient, string requesterIp, CommentLocationInput? location, CommentConsentInput? consent)
    {
        var signalHash = ComputeSignalHash(requesterIp, consent?.Location == true ? location : null);
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        await using (var findCommand = new MySqlCommand("SELECT id FROM comment_users WHERE signal_hash = @signal_hash LIMIT 1", connection))
        {
            findCommand.Parameters.AddWithValue("@signal_hash", signalHash);
            var existing = await findCommand.ExecuteScalarAsync();
            if (existing is not null)
            {
                return Convert.ToInt32(existing);
            }
        }

        var user = await InsertRandomCommentUserAsync(connection, httpClient, signalHash, requesterIp, location, consent);
        return (int)user.id;
    }

    public async Task<CommentUserSummary> CreateRandomCommentUserAsync(HttpClient httpClient)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        return await InsertRandomCommentUserAsync(connection, httpClient, Guid.NewGuid().ToString("N"), null, null, null);
    }

    public async Task<CommentRecord> CreateArticleCommentAsync(int articleId, string articleHash, int commentUserId, int? parentCommentId, string body)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        int? parentCommentUserId = null;
        if (parentCommentId is > 0)
        {
            await using var parentCommand = new MySqlCommand("SELECT comment_user_id FROM article_comments WHERE id = @id AND article_id = @article_id LIMIT 1", connection);
            parentCommand.Parameters.AddWithValue("@id", parentCommentId.Value);
            parentCommand.Parameters.AddWithValue("@article_id", articleId);
            var value = await parentCommand.ExecuteScalarAsync();
            if (value is null)
            {
                throw new InvalidOperationException("Parent comment was not found for this article.");
            }
            parentCommentUserId = Convert.ToInt32(value);
        }

        await using var command = new MySqlCommand(
            @"INSERT INTO article_comments (article_id, parent_comment_id, comment_user_id, body, status)
              VALUES (@article_id, @parent_comment_id, @comment_user_id, @body, 'published');
              SELECT LAST_INSERT_ID();",
            connection);
        command.Parameters.AddWithValue("@article_id", articleId);
        command.Parameters.AddWithValue("@parent_comment_id", DbValue(parentCommentId is > 0 ? parentCommentId : null));
        command.Parameters.AddWithValue("@comment_user_id", commentUserId);
        command.Parameters.AddWithValue("@body", body);
        var commentId = Convert.ToInt32(await command.ExecuteScalarAsync());

        if (parentCommentId is > 0 && parentCommentUserId is not null && parentCommentUserId.Value != commentUserId)
        {
            await using var messageCommand = new MySqlCommand(
                @"INSERT INTO comment_messages (recipient_comment_user_id, sender_comment_user_id, article_id, parent_comment_id, reply_comment_id)
                  VALUES (@recipient, @sender, @article_id, @parent_comment_id, @reply_comment_id)
                  ON DUPLICATE KEY UPDATE id = id",
                connection);
            messageCommand.Parameters.AddWithValue("@recipient", parentCommentUserId.Value);
            messageCommand.Parameters.AddWithValue("@sender", commentUserId);
            messageCommand.Parameters.AddWithValue("@article_id", articleId);
            messageCommand.Parameters.AddWithValue("@parent_comment_id", parentCommentId.Value);
            messageCommand.Parameters.AddWithValue("@reply_comment_id", commentId);
            await messageCommand.ExecuteNonQueryAsync();
        }

        return (await ListArticleCommentsAsync(articleId)).First(comment => comment.id == commentId);
    }

    public async Task<CommentUserSummary?> FindCommentUserAsync(int commentUserId)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        await using var command = new MySqlCommand("SELECT * FROM comment_users WHERE id = @id LIMIT 1", connection);
        command.Parameters.AddWithValue("@id", commentUserId);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? ReadCommentUser(reader) : null;
    }

    public async Task<(int total, int unread_total, List<object> items)> ListCommentMessagesAsync(int commentUserId, int limit)
    {
        await using var connection = await OpenConnectionAsync();
        await EnsureSchemaAsync(connection);
        await using var countCommand = new MySqlCommand("SELECT COUNT(*) AS total, SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) AS unread_total FROM comment_messages WHERE recipient_comment_user_id = @id", connection);
        countCommand.Parameters.AddWithValue("@id", commentUserId);
        await using var countReader = await countCommand.ExecuteReaderAsync();
        var total = 0;
        var unread = 0;
        if (await countReader.ReadAsync())
        {
            total = countReader.GetInt32("total");
            unread = countReader.IsDBNull(countReader.GetOrdinal("unread_total")) ? 0 : Convert.ToInt32(countReader["unread_total"]);
        }
        await countReader.CloseAsync();

        await using var command = new MySqlCommand(
            @"SELECT m.id, m.created_at, m.read_at, m.parent_comment_id, m.reply_comment_id,
                     a.article_hash, a.title AS article_title,
                     parent_comment.body AS parent_comment_body,
                     reply_comment.body AS reply_comment_body,
                     sender.id AS sender_user_id, sender.display_name AS sender_display_name,
                     sender.username AS sender_username, sender.profile_thumbnail_mime,
                     sender.profile_thumbnail_blob
              FROM comment_messages m
              INNER JOIN news_articles a ON a.id = m.article_id
              INNER JOIN article_comments parent_comment ON parent_comment.id = m.parent_comment_id
              INNER JOIN article_comments reply_comment ON reply_comment.id = m.reply_comment_id
              INNER JOIN comment_users sender ON sender.id = m.sender_comment_user_id
              WHERE m.recipient_comment_user_id = @id
              ORDER BY m.created_at DESC
              LIMIT @limit",
            connection);
        command.Parameters.AddWithValue("@id", commentUserId);
        command.Parameters.AddWithValue("@limit", limit);
        var items = new List<object>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            items.Add(new
            {
                id = reader.GetInt64("id"),
                created_at = reader["created_at"],
                read_at = reader["read_at"] is DBNull ? null : reader["read_at"],
                parent_comment_id = reader.GetInt64("parent_comment_id"),
                reply_comment_id = reader.GetInt64("reply_comment_id"),
                article = new { article_hash = reader.GetString("article_hash"), title = reader["article_title"] },
                parent_comment_excerpt = Excerpt(reader["parent_comment_body"] as string),
                reply_comment_excerpt = Excerpt(reader["reply_comment_body"] as string),
                sender = new
                {
                    id = reader.GetInt64("sender_user_id"),
                    display_name = reader.GetString("sender_display_name"),
                    username = reader["sender_username"] as string,
                    profile_thumbnail_data_url = ToDataUrl(reader["sender_profile_thumbnail_mime"] as string, reader["sender_profile_thumbnail_blob"] as byte[]),
                },
            });
        }

        return (total, unread, items);
    }

    private async Task<CommentUserSummary> InsertRandomCommentUserAsync(MySqlConnection connection, HttpClient httpClient, string signalHash, string? requesterIp, CommentLocationInput? location, CommentConsentInput? consent)
    {
        var randomUserJson = JsonNode.Parse(await httpClient.GetStringAsync("https://randomuser.me/api/"))!;
        var profile = randomUserJson["results"]?.AsArray().FirstOrDefault()?.AsObject() ?? new JsonObject();
        var displayName = string.Join(' ', new[] { profile["name"]?["first"]?.GetValue<string>(), profile["name"]?["last"]?.GetValue<string>() }.Where(part => !string.IsNullOrWhiteSpace(part)));
        displayName = string.IsNullOrWhiteSpace(displayName) ? profile["login"]?["username"]?.GetValue<string>() ?? "Guest Commenter" : displayName;
        var thumbnailUrl = profile["picture"]?["thumbnail"]?.GetValue<string>();
        var thumbnail = await DownloadThumbnailAsync(httpClient, thumbnailUrl);

        if (consent?.Location == true && location is not null)
        {
            profile["location"] = JsonSerializer.SerializeToNode(location, JsonOptions.Default);
        }

        await using var command = new MySqlCommand(
            @"INSERT INTO comment_users (
                signal_hash, profile_source, display_name, username, email_placeholder, gender, nat,
                randomuser_login_uuid, ip_address_value, ip_address_consent, location_consent, location_json,
                profile_thumbnail_url, profile_thumbnail_mime, profile_thumbnail_blob, raw_profile_json
              ) VALUES (
                @signal_hash, 'randomuser', @display_name, @username, @email, @gender, @nat,
                @uuid, @ip, @ip_consent, @location_consent, @location_json,
                @thumbnail_url, @thumbnail_mime, @thumbnail_blob, @raw_profile_json
              );
              SELECT LAST_INSERT_ID();",
            connection);
        command.Parameters.AddWithValue("@signal_hash", signalHash);
        command.Parameters.AddWithValue("@display_name", NormalizeNullableString(displayName, 191) ?? "Guest Commenter");
        command.Parameters.AddWithValue("@username", DbValue(NormalizeNullableString(profile["login"]?["username"]?.GetValue<object>(), 191)));
        command.Parameters.AddWithValue("@email", DbValue(NormalizeNullableString(profile["email"]?.GetValue<object>(), 191)));
        command.Parameters.AddWithValue("@gender", DbValue(NormalizeNullableString(profile["gender"]?.GetValue<object>(), 32)));
        command.Parameters.AddWithValue("@nat", DbValue(NormalizeNullableString(profile["nat"]?.GetValue<object>(), 16)));
        command.Parameters.AddWithValue("@uuid", DbValue(NormalizeNullableString(profile["login"]?["uuid"]?.GetValue<object>(), 36)));
        command.Parameters.AddWithValue("@ip", DbValue(consent?.IpAddress == true ? NormalizeNullableString(requesterIp, 64) : null));
        command.Parameters.AddWithValue("@ip_consent", consent?.IpAddress == true ? 1 : 0);
        command.Parameters.AddWithValue("@location_consent", consent?.Location == true ? 1 : 0);
        command.Parameters.AddWithValue("@location_json", DbValue(consent?.Location == true && location is not null ? JsonSerializer.Serialize(location, JsonOptions.Default) : null));
        command.Parameters.AddWithValue("@thumbnail_url", DbValue(thumbnailUrl));
        command.Parameters.AddWithValue("@thumbnail_mime", DbValue(thumbnail.mimeType));
        command.Parameters.AddWithValue("@thumbnail_blob", DbValue(thumbnail.bytes));
        command.Parameters.AddWithValue("@raw_profile_json", profile.ToJsonString());
        var id = Convert.ToInt32(await command.ExecuteScalarAsync());

        return (await FindCommentUserAsync(id))!;
    }

    private static async Task<(byte[]? bytes, string? mimeType)> DownloadThumbnailAsync(HttpClient httpClient, string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return (null, null);
        }

        try
        {
            using var response = await httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();
            return (await response.Content.ReadAsByteArrayAsync(), response.Content.Headers.ContentType?.MediaType);
        }
        catch
        {
            return (null, null);
        }
    }

    private static async Task<List<ArticleRecord>> ReadArticlesAsync(MySqlCommand command)
    {
        var items = new List<ArticleRecord>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            items.Add(ReadArticle(reader));
        }
        return items;
    }

    private static ArticleRecord ReadArticle(MySqlDataReader reader)
    {
        var rawArticle = JsonNode.Parse(reader["raw_article_json"] as string ?? "{}") as JsonObject;

        return new ArticleRecord(
            reader.GetString("article_hash"),
            reader["article_id"] as string,
            reader["title"] as string,
            reader["link"] as string,
            reader["snippet"] as string,
            rawArticle?["photo_url"]?.GetValue<string>(),
            rawArticle?["thumbnail_url"]?.GetValue<string>(),
            reader["source_name"] as string,
            reader["published_datetime_utc"] is DBNull ? null : reader["published_datetime_utc"],
            JsonSerializer.Deserialize<string[]>(reader["authors_json"] as string ?? "[]") ?? [],
            reader["endpoint_path"] as string,
            ParseStringDictionary(reader["query_params_json"] as string),
            reader["created_at"],
            reader["updated_at"]);
    }

    private static Dictionary<string, string> ParseStringDictionary(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new Dictionary<string, string>();
        }

        var node = JsonNode.Parse(json) as JsonObject;
        if (node is null)
        {
            return new Dictionary<string, string>();
        }

        return node.ToDictionary(
            item => item.Key,
            item => item.Value switch
            {
                null => "",
                JsonValue value => Convert.ToString(value.GetValue<object>()) ?? "",
                _ => item.Value.ToJsonString(),
            },
            StringComparer.OrdinalIgnoreCase);
    }

    private static CommentRecord ReadComment(MySqlDataReader reader)
    {
        return new CommentRecord(
            reader.GetInt64("id"),
            reader["parent_comment_id"] is DBNull ? null : Convert.ToInt64(reader["parent_comment_id"]),
            reader.GetString("body"),
            reader.GetString("status"),
            reader["created_at"],
            reader["updated_at"],
            new CommentUserRecord(
                reader.GetInt64("user_id"),
                reader.GetString("display_name"),
                reader["username"] as string,
                JsonNode.Parse(reader["raw_profile_json"] as string ?? "{}"),
                ToDataUrl(reader["profile_thumbnail_mime"] as string, reader["profile_thumbnail_blob"] as byte[])));
    }

    private static CommentUserSummary ReadCommentUser(MySqlDataReader reader)
    {
        return new CommentUserSummary(
            reader.GetInt64("id"),
            reader.GetString("display_name"),
            reader["username"] as string,
            reader["email_placeholder"] as string,
            reader["gender"] as string,
            reader["nat"] as string,
            reader["created_at"],
            ToDataUrl(reader["profile_thumbnail_mime"] as string, reader["profile_thumbnail_blob"] as byte[]));
    }

    private static string StableJson(Dictionary<string, string> values) =>
        JsonSerializer.Serialize(values.OrderBy(item => item.Key).ToDictionary(item => item.Key, item => item.Value), JsonOptions.Default);

    private static string StableHash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();

    private static object DbValue(object? value) => value ?? DBNull.Value;

    private static DateTime? ParseArticlePublishedDate(object? value)
    {
        var normalized = NormalizeNullableString(value);
        return DateTime.TryParse(normalized, out var parsed)
            ? DateTime.SpecifyKind(parsed.ToUniversalTime(), DateTimeKind.Unspecified)
            : null;
    }

    private static string? ToDataUrl(string? mimeType, byte[]? blob) =>
        string.IsNullOrWhiteSpace(mimeType) || blob is null ? null : $"data:{mimeType};base64,{Convert.ToBase64String(blob)}";

    private static string ComputeSignalHash(string requesterIp, CommentLocationInput? location)
    {
        var payload = JsonSerializer.Serialize(new { ipAddress = requesterIp, location }, JsonOptions.Default);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();
    }

    private static string Excerpt(string? value)
    {
        var normalized = NormalizeNullableString(value) ?? "";
        return normalized.Length > 180 ? $"{normalized[..177]}..." : normalized;
    }
}

public static class SchemaStatements
{
    public static readonly string[] All =
    [
        @"CREATE TABLE IF NOT EXISTS news_articles (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            article_hash CHAR(64) NOT NULL,
            article_id VARCHAR(191) NULL,
            title TEXT NULL,
            link TEXT NULL,
            snippet TEXT NULL,
            source_name VARCHAR(191) NULL,
            published_datetime_utc DATETIME NULL,
            authors_json TEXT NULL,
            endpoint_path VARCHAR(255) NULL,
            query_params_json TEXT NULL,
            raw_article_json LONGTEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_news_articles_article_hash (article_hash),
            KEY idx_news_articles_published_datetime_utc (published_datetime_utc)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",
        @"CREATE TABLE IF NOT EXISTS api_cache_entries (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            api_source VARCHAR(64) NOT NULL,
            endpoint_path VARCHAR(255) NOT NULL,
            query_params_json TEXT NOT NULL,
            query_params_hash CHAR(64) NOT NULL,
            payload_json LONGTEXT NOT NULL,
            fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_api_cache_entries_lookup (api_source, endpoint_path, query_params_hash)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",
        @"CREATE TABLE IF NOT EXISTS comment_users (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            signal_hash CHAR(64) NOT NULL,
            profile_source VARCHAR(32) NOT NULL DEFAULT 'randomuser',
            display_name VARCHAR(191) NOT NULL,
            username VARCHAR(191) NULL,
            email_placeholder VARCHAR(191) NULL,
            gender VARCHAR(32) NULL,
            nat VARCHAR(16) NULL,
            randomuser_login_uuid CHAR(36) NULL,
            ip_address_value VARCHAR(64) NULL,
            ip_address_consent TINYINT(1) NOT NULL DEFAULT 0,
            location_consent TINYINT(1) NOT NULL DEFAULT 0,
            location_json LONGTEXT NULL,
            profile_thumbnail_url TEXT NULL,
            profile_thumbnail_mime VARCHAR(64) NULL,
            profile_thumbnail_blob LONGBLOB NULL,
            raw_profile_json LONGTEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_comment_users_signal_hash (signal_hash)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",
        @"CREATE TABLE IF NOT EXISTS article_comments (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            article_id INT UNSIGNED NOT NULL,
            parent_comment_id BIGINT UNSIGNED NULL,
            comment_user_id BIGINT UNSIGNED NOT NULL,
            body TEXT NOT NULL,
            status ENUM('published', 'hidden', 'deleted') NOT NULL DEFAULT 'published',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL,
            PRIMARY KEY (id),
            KEY idx_article_comments_article_id (article_id),
            KEY idx_article_comments_parent_comment_id (parent_comment_id),
            KEY idx_article_comments_comment_user_id (comment_user_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",
        @"CREATE TABLE IF NOT EXISTS comment_messages (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            recipient_comment_user_id BIGINT UNSIGNED NOT NULL,
            sender_comment_user_id BIGINT UNSIGNED NOT NULL,
            article_id INT UNSIGNED NOT NULL,
            parent_comment_id BIGINT UNSIGNED NOT NULL,
            reply_comment_id BIGINT UNSIGNED NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_comment_messages_reply_comment_id (reply_comment_id),
            KEY idx_comment_messages_recipient_created_at (recipient_comment_user_id, created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",
    ];
}

public static class OpenApiDocument
{
    private static readonly object OkResponse = new { description = "Success" };
    private static readonly object CreatedResponse = new { description = "Created" };

    public static object Build(HttpContext context) => new
    {
        openapi = "3.0.3",
        info = new { title = "News .NET API", version = "0.1.0", description = "ASP.NET Core API for NewsAggregator." },
        servers = new[] { new { url = $"{context.Request.Scheme}://{context.Request.Host}{context.Request.PathBase}", description = "Current server" } },
        paths = new Dictionary<string, object>
        {
            ["/health"] = new { get = Operation("Check service health") },
            ["/api/news"] = new
            {
                get = Operation(
                    "Fetch RapidAPI news through server-side cache",
                    OkResponse,
                    QueryParameter("endpointPath", "RapidAPI endpoint path, for example /search, /business, or /topic-headlines", required: true)),
            },
            ["/api/hero-articles"] = new { get = Operation("List featured saved articles") },
            ["/api/mysql/articles/status"] = new { post = Operation("Check article hashes already saved") },
            ["/api/mysql/articles"] = new { get = Operation("List saved articles"), post = Operation("Save one article", CreatedResponse) },
            ["/api/articles/{articleHash}"] = new { get = Operation("Get one saved article", OkResponse, ArticleHashParameter()) },
            ["/api/articles/{articleHash}/comments"] = new
            {
                get = Operation("List article comments", OkResponse, ArticleHashParameter()),
                post = Operation("Create article comment", CreatedResponse, ArticleHashParameter()),
            },
            ["/api/comment-users/random"] = new { post = Operation("Create random comment user", CreatedResponse) },
            ["/api/comment-messages/inbox"] = new { get = Operation("List comment reply messages") },
        },
    };

    private static object Operation(string summary, object? successResponse = null, params object[] parameters)
    {
        var operation = new Dictionary<string, object>
        {
            ["summary"] = summary,
            ["responses"] = new Dictionary<string, object>
            {
                ["200"] = successResponse ?? OkResponse,
            },
        };

        if (parameters.Length > 0)
        {
            operation["parameters"] = parameters;
        }

        return operation;
    }

    private static object ArticleHashParameter() => new
    {
        name = "articleHash",
        @in = "path",
        required = true,
        schema = new { type = "string" },
    };

    private static object QueryParameter(string name, string description, bool required = false) => new
    {
        name,
        @in = "query",
        required,
        description,
        schema = new { type = "string" },
    };
}

public static class JsonOptions
{
    public static readonly JsonSerializerOptions Default = new(JsonSerializerDefaults.Web);
}

public sealed record ArticleStatusRequest(List<JsonObject>? Articles);
public sealed record SaveArticleRequest(JsonObject? Article, string? EndpointPath, Dictionary<string, string>? QueryParams);
public sealed record CreateCommentRequest(string? Body, int? ParentCommentId, int? CommentUserId, CommentConsentInput? Consent, CommentLocationInput? Location);
public sealed record CommentConsentInput(bool IpAddress, bool Location);
public sealed record CommentLocationInput(string? City, string? State, string? Country, string? Postcode, string? Latitude, string? Longitude);
public sealed record SyncStatus(int attempted, int inserted, int updated, string status);
public sealed record ArticleInternalId(int Id, string ArticleHash);

public sealed record ArticleRecord(
    string article_hash,
    string? article_id,
    string? title,
    string? link,
    string? snippet,
    string? photo_url,
    string? thumbnail_url,
    string? source_name,
    object? published_datetime_utc,
    string[] authors,
    string? endpoint_path,
    Dictionary<string, string> query_params,
    object? created_at,
    object? updated_at)
{
    public string? SourceName => source_name;
}

public sealed record CommentUserRecord(long id, string display_name, string? username, JsonNode? profile, string? profile_thumbnail_data_url);
public sealed record CommentUserSummary(long id, string display_name, string? username, string? email_placeholder, string? gender, string? nat, object? created_at, string? profile_thumbnail_data_url);
public sealed record CommentRecord(long id, long? parent_comment_id, string body, string status, object? created_at, object? updated_at, CommentUserRecord user);

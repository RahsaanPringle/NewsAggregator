using System.Net;
using System.Text.RegularExpressions;
using MySqlConnector;

const string CreateArticleDataTableSql = """
    CREATE TABLE IF NOT EXISTS article_data (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      article_id INT UNSIGNED NOT NULL,
      source_url TEXT NOT NULL,
      raw_html LONGTEXT NOT NULL,
      raw_text LONGTEXT NOT NULL,
      fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_article_data_article_id (article_id),
      CONSTRAINT fk_article_data_article
        FOREIGN KEY (article_id) REFERENCES news_articles(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """;

var options = SpiderOptions.Parse(args);
var envPath = Path.GetFullPath(options.EnvPath);
var environment = DotEnv.Load(envPath);
var connectionString = DatabaseSettings.From(environment).BuildConnectionString();

using var httpClient = new HttpClient(new HttpClientHandler
{
    AutomaticDecompression = DecompressionMethods.All,
})
{
    Timeout = TimeSpan.FromSeconds(options.RequestTimeoutSeconds),
};
httpClient.DefaultRequestHeaders.UserAgent.ParseAdd(options.UserAgent);
httpClient.DefaultRequestHeaders.Accept.ParseAdd("text/html,application/xhtml+xml");

Console.WriteLine($"WebSpider using database settings from {envPath}");

await using (var connection = new MySqlConnection(connectionString))
{
    await connection.OpenAsync();
    await using var schemaCommand = new MySqlCommand(CreateArticleDataTableSql, connection);
    await schemaCommand.ExecuteNonQueryAsync();
}

do
{
    try
    {
        await ProcessNextArticleAsync(connectionString, httpClient);
    }
    catch (Exception exception)
    {
        Console.Error.WriteLine($"[{DateTimeOffset.Now:u}] Spider pass failed: {exception.Message}");
    }

    if (!options.RunOnce)
    {
        await Task.Delay(TimeSpan.FromSeconds(options.DelaySeconds));
    }
} while (!options.RunOnce);

static async Task ProcessNextArticleAsync(string connectionString, HttpClient httpClient)
{
    await using var connection = new MySqlConnection(connectionString);
    await connection.OpenAsync();

    var article = await FindRandomUnprocessedArticleAsync(connection);
    if (article is null)
    {
        Console.WriteLine($"[{DateTimeOffset.Now:u}] No unprocessed articles with HTTP(S) links were found.");
        return;
    }

    Console.WriteLine($"[{DateTimeOffset.Now:u}] Fetching article {article.Id}: {article.Url}");
    using var response = await httpClient.GetAsync(article.Url, HttpCompletionOption.ResponseHeadersRead);
    response.EnsureSuccessStatusCode();

    var mediaType = response.Content.Headers.ContentType?.MediaType;
    if (mediaType is not null && !mediaType.Contains("html", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException($"Expected HTML but received {mediaType} for article {article.Id}.");
    }

    var html = await response.Content.ReadAsStringAsync();
    if (string.IsNullOrWhiteSpace(html))
    {
        throw new InvalidOperationException($"The response was empty for article {article.Id}.");
    }

    var text = ArticleTextExtractor.Extract(html);

    await using var command = new MySqlCommand(
        """
        INSERT INTO article_data (article_id, source_url, raw_html, raw_text)
        VALUES (@article_id, @source_url, @raw_html, @raw_text)
        ON DUPLICATE KEY UPDATE article_id = article_id;
        """,
        connection);
    command.Parameters.AddWithValue("@article_id", article.Id);
    command.Parameters.AddWithValue("@source_url", article.Url);
    command.Parameters.AddWithValue("@raw_html", html);
    command.Parameters.AddWithValue("@raw_text", text);
    await command.ExecuteNonQueryAsync();

    Console.WriteLine($"[{DateTimeOffset.Now:u}] Stored article {article.Id}: {html.Length:N0} HTML chars, {text.Length:N0} text chars.");
}

static async Task<ArticleCandidate?> FindRandomUnprocessedArticleAsync(MySqlConnection connection)
{
    await using var command = new MySqlCommand(
        """
        SELECT a.id, a.link
        FROM news_articles a
        LEFT JOIN article_data data ON data.article_id = a.id
        WHERE data.article_id IS NULL
          AND (a.link LIKE 'http://%' OR a.link LIKE 'https://%')
        ORDER BY RAND()
        LIMIT 1;
        """,
        connection);

    await using var reader = await command.ExecuteReaderAsync();
    return await reader.ReadAsync()
        ? new ArticleCandidate(reader.GetUInt32("id"), reader.GetString("link"))
        : null;
}

internal sealed record ArticleCandidate(uint Id, string Url);

internal sealed record SpiderOptions(string EnvPath, bool RunOnce, int DelaySeconds, int RequestTimeoutSeconds, string UserAgent)
{
    public static SpiderOptions Parse(string[] args)
    {
        var defaultEnvPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "news-api", ".env.local");
        var envPath = GetValue(args, "--env") ?? defaultEnvPath;
        var delaySeconds = ParsePositiveInt(GetValue(args, "--delay-seconds"), 10, "--delay-seconds");
        var timeoutSeconds = ParsePositiveInt(GetValue(args, "--timeout-seconds"), 30, "--timeout-seconds");
        var userAgent = GetValue(args, "--user-agent") ?? "NewsAggregator-WebSpider/1.0";
        return new SpiderOptions(envPath, args.Contains("--once", StringComparer.OrdinalIgnoreCase), delaySeconds, timeoutSeconds, userAgent);
    }

    private static string? GetValue(string[] args, string name)
    {
        var index = Array.FindIndex(args, value => value.Equals(name, StringComparison.OrdinalIgnoreCase));
        if (index < 0)
        {
            return null;
        }

        if (index + 1 >= args.Length || args[index + 1].StartsWith("--", StringComparison.Ordinal))
        {
            throw new ArgumentException($"{name} requires a value.");
        }

        return args[index + 1];
    }

    private static int ParsePositiveInt(string? value, int fallback, string optionName)
    {
        if (value is null)
        {
            return fallback;
        }

        return int.TryParse(value, out var parsed) && parsed > 0
            ? parsed
            : throw new ArgumentException($"{optionName} must be a positive integer.");
    }
}

internal sealed record DatabaseSettings(string Host, uint Port, string Database, string User, string Password)
{
    public static DatabaseSettings From(IReadOnlyDictionary<string, string> values)
    {
        var host = Required(values, "MYSQL_HOST");
        var database = Required(values, "MYSQL_DATABASE");
        var user = Required(values, "MYSQL_USER");
        var password = Required(values, "MYSQL_PASSWORD");
        var portText = values.GetValueOrDefault("MYSQL_PORT", "3306");
        if (!uint.TryParse(portText, out var port))
        {
            throw new InvalidOperationException("MYSQL_PORT must be a valid unsigned integer.");
        }

        return new DatabaseSettings(host, port, database, user, password);
    }

    public string BuildConnectionString() => new MySqlConnectionStringBuilder
    {
        Server = Host,
        Port = Port,
        Database = Database,
        UserID = User,
        Password = Password,
        CharacterSet = "utf8mb4",
        AllowUserVariables = true,
    }.ConnectionString;

    private static string Required(IReadOnlyDictionary<string, string> values, string name) =>
        values.TryGetValue(name, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : throw new InvalidOperationException($"Missing required setting {name}.");
}

internal static class DotEnv
{
    public static IReadOnlyDictionary<string, string> Load(string path)
    {
        if (!File.Exists(path))
        {
            throw new FileNotFoundException("The database environment file was not found.", path);
        }

        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var rawLine in File.ReadLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim();
            if (value.Length >= 2 && ((value[0] == '"' && value[^1] == '"') || (value[0] == '\'' && value[^1] == '\'')))
            {
                value = value[1..^1];
            }

            values[key] = value;
        }

        return values;
    }
}

internal static partial class ArticleTextExtractor
{
    public static string Extract(string html)
    {
        var withoutIgnoredContent = IgnoredElementRegex().Replace(html, " ");
        var withLineBreaks = BlockBoundaryRegex().Replace(withoutIgnoredContent, "\n");
        var withoutTags = HtmlTagRegex().Replace(withLineBreaks, " ");
        var decoded = WebUtility.HtmlDecode(withoutTags);
        var normalizedLines = decoded
            .Split('\n', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(line => HorizontalWhitespaceRegex().Replace(line, " "))
            .Where(line => line.Length > 0);
        return string.Join(Environment.NewLine, normalizedLines);
    }

    [GeneratedRegex(@"<(script|style|noscript|svg)\b[^>]*>[\s\S]*?</\1\s*>", RegexOptions.IgnoreCase)]
    private static partial Regex IgnoredElementRegex();

    [GeneratedRegex(@"</?(article|aside|blockquote|br|dd|div|dl|dt|figcaption|figure|footer|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|td|th|tr|ul)\b[^>]*>", RegexOptions.IgnoreCase)]
    private static partial Regex BlockBoundaryRegex();

    [GeneratedRegex(@"<[^>]+>")]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex(@"[\t\f\v ]+")]
    private static partial Regex HorizontalWhitespaceRegex();
}

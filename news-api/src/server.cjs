const crypto = require('node:crypto')
const path = require('node:path')
const dotenv = require('dotenv')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const mysql = require('mysql2/promise')
const swaggerUi = require('swagger-ui-express')
const openApiSpec = require('./openapi.cjs')

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config()

const PORT = Number(process.env.PORT || 4001)
const MYSQL_HOST = normalizeString(process.env.MYSQL_HOST || 'my04.winhost.com')
const MYSQL_PORT = Number(process.env.MYSQL_PORT || 3306)
const MYSQL_DATABASE = normalizeString(process.env.MYSQL_DATABASE)
const MYSQL_USER = normalizeString(process.env.MYSQL_USER)
const MYSQL_PASSWORD = normalizeString(process.env.MYSQL_PASSWORD)
const CORS_ORIGIN = normalizeCorsOrigins(process.env.CORS_ORIGIN)

const pool = createMysqlPool()
const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: false }))

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.get('/openapi.json', (_request, response) => {
  response.json(openApiSpec)
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { explorer: true }))

app.post('/api/mysql/articles/status', async (request, response) => {
  const articles = Array.isArray(request.body?.articles) ? request.body.articles : []
  const articleHashes = articles.map((article) => computeArticleHash(article))

  if (!isMysqlConfigured()) {
    response.status(200).json({
      enabled: false,
      message: 'MySQL is not configured.',
      articleHashes: [],
      existingArticleHashes: [],
    })
    return
  }

  try {
    await ensureSchema()

    if (articleHashes.length === 0) {
      response.status(200).json({
        enabled: true,
        articleHashes: [],
        existingArticleHashes: [],
      })
      return
    }

    const uniqueHashes = [...new Set(articleHashes)]
    const placeholders = uniqueHashes.map(() => '?').join(', ')
    const [rows] = await pool.query(
      `SELECT article_hash FROM news_articles WHERE article_hash IN (${placeholders})`,
      uniqueHashes,
    )

    response.status(200).json({
      enabled: true,
      articleHashes,
      existingArticleHashes: rows.map((row) => row.article_hash),
    })
  } catch (error) {
    response.status(502).json({
      enabled: false,
      error: error.message || 'Unable to query MySQL article status.',
    })
  }
})

app.post('/api/mysql/articles', async (request, response) => {
  if (!isMysqlConfigured()) {
    response.status(503).json({ error: 'MySQL is not configured.' })
    return
  }

  const article = request.body?.article
  const endpointPath = normalizeString(request.body?.endpointPath)
  const queryParams = isPlainObject(request.body?.queryParams) ? request.body.queryParams : {}

  if (!isPlainObject(article)) {
    response.status(400).json({ error: 'Request body must include an article object.' })
    return
  }

  try {
    await ensureSchema()

    const articleHash = computeArticleHash(article)
    const [existingRows] = await pool.query('SELECT id FROM news_articles WHERE article_hash = ? LIMIT 1', [articleHash])

    if (existingRows.length > 0) {
      response.status(200).json({ articleHash, inserted: false, alreadyExists: true })
      return
    }

    const authors = Array.isArray(article.authors) ? article.authors : []
    const publishedAtUtc = parseArticlePublishedDate(article.published_datetime_utc)

    await pool.execute(
      `INSERT INTO news_articles (
        article_hash,
        article_id,
        title,
        link,
        snippet,
        source_name,
        published_datetime_utc,
        authors_json,
        endpoint_path,
        query_params_json,
        raw_article_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        articleHash,
        normalizeNullableString(article.article_id, 191),
        normalizeNullableString(article.title),
        normalizeNullableString(article.link),
        normalizeNullableString(article.snippet),
        normalizeNullableString(article.source_name, 191),
        publishedAtUtc,
        JSON.stringify(authors),
        normalizeNullableString(endpointPath, 255),
        JSON.stringify(queryParams),
        JSON.stringify(article),
      ],
    )

    response.status(201).json({ articleHash, inserted: true, alreadyExists: false })
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to save article to MySQL.' })
  }
})

app.get('/api/mysql/articles', listArticlesHandler)
app.get('/api/articles', listArticlesHandler)

async function listArticlesHandler(request, response) {
  if (!isMysqlConfigured()) {
    response.status(503).json({ error: 'MySQL is not configured.' })
    return
  }

  try {
    await ensureSchema()

    const limit = clampInteger(request.query.limit, 50, 1, 500)
    const offset = clampInteger(request.query.offset, 0, 0, 1000000)
    const search = normalizeString(request.query.search)

    const params = []
    let whereClause = ''

    if (search) {
      whereClause = 'WHERE title LIKE ? OR snippet LIKE ? OR source_name LIKE ? OR link LIKE ?'
      const term = `%${search}%`
      params.push(term, term, term, term)
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM news_articles ${whereClause}`,
      params,
    )

    const [rows] = await pool.query(
      `SELECT
        article_hash,
        article_id,
        title,
        link,
        snippet,
        source_name,
        published_datetime_utc,
        authors_json,
        endpoint_path,
        query_params_json,
        created_at,
        updated_at
      FROM news_articles
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    )

    response.json({
      items: rows.map(normalizeArticleRow),
      limit,
      offset,
      total: countRows[0]?.total ?? 0,
    })
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to load articles from MySQL.' })
  }
}

app.get('/api/articles/:articleHash', async (request, response) => {
  if (!isMysqlConfigured()) {
    response.status(503).json({ error: 'MySQL is not configured.' })
    return
  }

  try {
    await ensureSchema()

    const [rows] = await pool.query('SELECT * FROM news_articles WHERE article_hash = ? LIMIT 1', [request.params.articleHash])
    if (rows.length === 0) {
      response.status(404).json({ error: 'Article not found.' })
      return
    }

    response.json(normalizeArticleRow(rows[0]))
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to load article from MySQL.' })
  }
})

app.use((error, _request, response, _next) => {
  response.status(500).json({ error: error.message || 'Unexpected server error.' })
})

app.listen(PORT, () => {
  console.log(`News API listening on http://127.0.0.1:${PORT}`)
  console.log(`Swagger UI available at http://127.0.0.1:${PORT}/docs`)
})

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS news_articles (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
}

function createMysqlPool() {
  return mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  })
}

function isMysqlConfigured() {
  return Boolean(MYSQL_HOST && MYSQL_DATABASE && MYSQL_USER && MYSQL_PASSWORD)
}

function computeArticleHash(article) {
  const stablePayload = {
    articleId: normalizeString(article?.article_id),
    title: normalizeString(article?.title),
    link: normalizeString(article?.link),
    snippet: normalizeString(article?.snippet),
    sourceName: normalizeString(article?.source_name),
    publishedDatetimeUtc: normalizeString(article?.published_datetime_utc),
    authors: Array.isArray(article?.authors)
      ? article.authors.map((author) => normalizeString(author)).filter(Boolean)
      : [],
  }

  return crypto.createHash('sha256').update(JSON.stringify(stablePayload)).digest('hex')
}

function normalizeArticleRow(row) {
  return {
    article_hash: row.article_hash,
    article_id: row.article_id,
    title: row.title,
    link: row.link,
    snippet: row.snippet,
    source_name: row.source_name,
    published_datetime_utc: row.published_datetime_utc,
    authors: safeJsonParse(row.authors_json, []),
    endpoint_path: row.endpoint_path,
    query_params: safeJsonParse(row.query_params_json, {}),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function normalizeString(value, maxLength = 65535) {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = String(value).trim()
  if (!normalized) {
    return null
  }

  return normalized.slice(0, maxLength)
}

function normalizeNullableString(value, maxLength = 65535) {
  return normalizeString(value, maxLength)
}

function parseArticlePublishedDate(value) {
  const normalized = normalizeString(value)
  if (!normalized) {
    return null
  }

  const parsedDate = new Date(normalized)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate.toISOString().slice(0, 19).replace('T', ' ')
}

function safeJsonParse(value, fallback) {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clampInteger(value, defaultValue, min, max) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (Number.isNaN(parsed)) {
    return defaultValue
  }

  return Math.min(max, Math.max(min, parsed))
}

function normalizeCorsOrigins(value) {
  if (!value) {
    return true
  }

  const origins = String(value)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return origins.length > 0 ? origins : true
}

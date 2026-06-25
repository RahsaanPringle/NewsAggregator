const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const dotenv = require('dotenv')
const jsonServer = require('json-server')
const mysql = require('mysql2/promise')

const PORT = Number(process.env.JSON_SERVER_PORT || 4000)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const RAPID_API_HOST = 'real-time-news-data.p.rapidapi.com'
const DB_FILE_PATH = path.join(__dirname, 'db.json')

let mysqlPool = null

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config()

ensureDbFile()

const server = jsonServer.create()
const router = jsonServer.router(DB_FILE_PATH)
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.use(jsonServer.bodyParser)

server.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

server.get('/api/news', async (request, response) => {
  const endpointPath = normalizeEndpointPath(request.query.endpointPath)

  if (!endpointPath) {
    response.status(400).json({ error: 'Missing endpointPath query parameter.' })
    return
  }

  const queryParams = buildQueryParams(request.query)
  const cacheKey = createCacheKey(endpointPath, queryParams)
  const cacheCollection = getCacheCollection('rapidApi', endpointPath)
  const cachedEntry = cacheCollection.find({ id: cacheKey }).value()

  if (cachedEntry && !isExpired(cachedEntry.fetchedAt)) {
    response.json(cachedEntry.payload)
    return
  }

  const apiKey = process.env.RAPIDAPI_KEY || process.env.VITE_RAPIDAPI_KEY
  if (!apiKey) {
    if (cachedEntry) {
      response.json(cachedEntry.payload)
      return
    }

    response.status(500).json({
      error: 'Missing RapidAPI key. Set RAPIDAPI_KEY or VITE_RAPIDAPI_KEY before starting the cache server.',
    })
    return
  }

  try {
    const payload = await fetchFromRapidApi(endpointPath, queryParams, apiKey)
    const timestamp = new Date().toISOString()

    const entry = {
      id: cacheKey,
      endpointPath,
      queryParams,
      payload,
      fetchedAt: timestamp,
    }

    if (cachedEntry) {
      cacheCollection.find({ id: cacheKey }).assign(entry).write()
    } else {
      cacheCollection.push(entry).write()
    }

    response.json(payload)
  } catch (error) {
    if (cachedEntry) {
      response.json(cachedEntry.payload)
      return
    }

    response.status(502).json({ error: error.message || 'Unable to refresh news cache.' })
  }
})

server.post('/api/mysql/articles/status', async (request, response) => {
  const mysqlConfig = getMysqlConfig()

  if (!mysqlConfig) {
    response.status(200).json({
      enabled: false,
      message:
        'MySQL is not configured. Set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD in your environment.',
      articleHashes: [],
      existingArticleHashes: [],
    })
    return
  }

  const articles = Array.isArray(request.body?.articles) ? request.body.articles : []
  const articleHashes = articles.map((article) => computeArticleHash(article))

  if (articleHashes.length === 0) {
    response.status(200).json({
      enabled: true,
      articleHashes: [],
      existingArticleHashes: [],
    })
    return
  }

  const uniqueHashes = [...new Set(articleHashes)]

  try {
    const pool = await getMysqlPool(mysqlConfig)
    await ensureMySqlArticleTable(pool)

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

server.post('/api/mysql/articles', async (request, response) => {
  const mysqlConfig = getMysqlConfig()

  if (!mysqlConfig) {
    response.status(400).json({
      error:
        'MySQL is not configured. Set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD in your environment.',
    })
    return
  }

  const article = request.body?.article
  const endpointPath = normalizeEndpointPath(request.body?.endpointPath)
  const queryParams = isPlainObject(request.body?.queryParams) ? request.body.queryParams : {}

  if (!article || !isPlainObject(article)) {
    response.status(400).json({ error: 'Request body must include an article object.' })
    return
  }

  const articleHash = computeArticleHash(article)

  try {
    const pool = await getMysqlPool(mysqlConfig)
    await ensureMySqlArticleTable(pool)

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

server.use(router)

server.listen(PORT, () => {
  console.log(`News cache server listening on http://127.0.0.1:${PORT}`)
})

function ensureDbFile() {
  if (fs.existsSync(DB_FILE_PATH)) {
    return
  }

  fs.mkdirSync(path.dirname(DB_FILE_PATH), { recursive: true })
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify({}, null, 2))
}

function getCacheCollection(apiSource, endpointPath) {
  const collectionName = buildCollectionName(apiSource, endpointPath)

  if (!router.db.has(collectionName).value()) {
    router.db.set(collectionName, []).write()
  }

  return router.db.get(collectionName)
}

function buildCollectionName(apiSource, endpointPath) {
  const sourceSegment = slugifyCollectionSegment(apiSource)
  const endpointSegment = slugifyCollectionSegment(endpointPath.replace(/^\//, ''))

  return `${sourceSegment}_${endpointSegment || 'root'}`
}

function slugifyCollectionSegment(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function normalizeEndpointPath(endpointPath) {
  if (typeof endpointPath !== 'string' || !endpointPath.trim()) {
    return ''
  }

  return endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`
}

function buildQueryParams(query) {
  const queryParams = { ...query }
  delete queryParams.endpointPath

  return Object.keys(queryParams)
    .sort()
    .reduce((result, key) => {
      const value = queryParams[key]

      if (value !== undefined && value !== null && value !== '') {
        result[key] = String(value)
      }

      return result
    }, {})
}

function createCacheKey(endpointPath, queryParams) {
  return `${endpointPath}?${new URLSearchParams(queryParams).toString()}`
}

function isExpired(fetchedAt) {
  if (!fetchedAt) {
    return true
  }

  const fetchedTime = new Date(fetchedAt).getTime()
  if (Number.isNaN(fetchedTime)) {
    return true
  }

  return Date.now() - fetchedTime >= CACHE_TTL_MS
}

async function fetchFromRapidApi(endpointPath, queryParams, apiKey) {
  const queryString = new URLSearchParams(queryParams).toString()
  const requestUrl = `https://${RAPID_API_HOST}${endpointPath}${queryString ? `?${queryString}` : ''}`

  const apiResponse = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': RAPID_API_HOST,
      'x-rapidapi-key': apiKey,
    },
  })

  if (!apiResponse.ok) {
    throw new Error(`RapidAPI request failed with status ${apiResponse.status}`)
  }

  return apiResponse.json()
}

function getMysqlConfig() {
  const host = normalizeNullableString(process.env.MYSQL_HOST)
  const database = normalizeNullableString(process.env.MYSQL_DATABASE)
  const user = normalizeNullableString(process.env.MYSQL_USER)
  const password = normalizeNullableString(process.env.MYSQL_PASSWORD)

  if (!host || !database || !user || !password) {
    return null
  }

  return {
    host,
    database,
    user,
    password,
    port: Number(process.env.MYSQL_PORT || 3306),
  }
}

async function getMysqlPool(config) {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    })
  }

  return mysqlPool
}

async function ensureMySqlArticleTable(pool) {
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

function computeArticleHash(article) {
  const stablePayload = {
    articleId: normalizeNullableString(article?.article_id),
    title: normalizeNullableString(article?.title),
    link: normalizeNullableString(article?.link),
    snippet: normalizeNullableString(article?.snippet),
    sourceName: normalizeNullableString(article?.source_name),
    publishedDatetimeUtc: normalizeNullableString(article?.published_datetime_utc),
    authors: Array.isArray(article?.authors)
      ? article.authors.map((author) => normalizeNullableString(author)).filter(Boolean)
      : [],
  }

  return crypto.createHash('sha256').update(JSON.stringify(stablePayload)).digest('hex')
}

function normalizeNullableString(value, maxLength = 65535) {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = String(value).trim()
  if (!normalized) {
    return null
  }

  if (normalized.length > maxLength) {
    return normalized.slice(0, maxLength)
  }

  return normalized
}

function parseArticlePublishedDate(value) {
  const normalized = normalizeNullableString(value)
  if (!normalized) {
    return null
  }

  const parsedDate = new Date(normalized)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate.toISOString().slice(0, 19).replace('T', ' ')
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

migrateLegacyCacheEntries()

function migrateLegacyCacheEntries() {
  const legacyEntries = router.db.get('cacheEntries').value()

  if (!Array.isArray(legacyEntries) || legacyEntries.length === 0) {
    return
  }

  legacyEntries.forEach((entry) => {
    const endpointPath = normalizeEndpointPath(entry.endpointPath)
    if (!endpointPath) {
      return
    }

    const collection = getCacheCollection('rapidApi', endpointPath)
    const existingEntry = collection.find({ id: entry.id }).value()

    if (existingEntry) {
      collection.find({ id: entry.id }).assign(entry).write()
      return
    }

    collection.push(entry).write()
  })

  router.db.unset('cacheEntries').write()
}

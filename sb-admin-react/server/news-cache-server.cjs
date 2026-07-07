const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const dotenv = require('dotenv')
const jsonServer = require('json-server')
const mysql = require('mysql2/promise')

const PORT = Number(process.env.JSON_SERVER_PORT || 4000)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const RAPID_API_HOST = 'real-time-news-data.p.rapidapi.com'
const GOOGLE_NEWS_API_HOST = 'google-news13.p.rapidapi.com'
const WORLD_ENDPOINT_PATH = '/topic-headlines'
const WORLD_QUERY_PARAMS = {
  topic: 'WORLD',
  limit: 500,
  country: 'US',
  lang: 'en',
}
const COVERAGE_ENDPOINT_PATH = '/full-story-coverage'
const COVERAGE_QUERY_PARAMS = {
  story: 'CAAqNggKIjBDQklTSGpvSmMzUnZjbmt0TXpZd1NoRUtEd2pibk5UN0VCSDVpWndxM3pJc0hDZ0FQAQ',
  sort: 'RELEVANCE',
  country: 'US',
  lang: 'en',
}
const BUSINESS_ENDPOINT_PATH = '/business'
const BUSINESS_QUERY_PARAMS = {
  lr: 'en-US',
}
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

server.get('/api/business-news', async (_request, response) => {
  const apiKey = process.env.RAPIDAPI_KEY || process.env.VITE_RAPIDAPI_KEY
  const mysqlConfig = getMysqlConfig()
  if (!mysqlConfig) {
    response.status(400).json({
      error:
        'MySQL is not configured. Set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD in your environment.',
    })
    return
  }

  try {
    const pool = await getMysqlPool(mysqlConfig)
    await ensureMySqlArticleTable(pool)
    let randomArticles = await listRandomArticlesByEndpoint(pool, BUSINESS_ENDPOINT_PATH, 9)

    const synced = {
      attempted: 0,
      inserted: 0,
      updated: 0,
    }

    if (apiKey) {
      try {
        const payload = await fetchGoogleBusinessNews(apiKey)
        const normalizedArticles = normalizeGoogleBusinessArticles(payload)

        const { insertedCount, updatedCount } = await saveArticlesToMysql(
          pool,
          normalizedArticles,
          BUSINESS_ENDPOINT_PATH,
          BUSINESS_QUERY_PARAMS,
        )

        synced.attempted = normalizedArticles.length
        synced.inserted = insertedCount
        synced.updated = updatedCount

        randomArticles = await listRandomArticlesByEndpoint(pool, BUSINESS_ENDPOINT_PATH, 9)
      } catch (error) {
        console.error('[business-news] upstream sync failed', {
          message: error?.message,
          upstreamStatus: error?.upstreamStatus,
          upstreamStatusText: error?.upstreamStatusText,
          upstreamBody: error?.upstreamBody,
        })
      }
    } else {
      console.warn('[business-news] skipped upstream sync: missing RAPIDAPI_KEY or VITE_RAPIDAPI_KEY')
    }

    response.json({
      source: 'mysql',
      endpointPath: BUSINESS_ENDPOINT_PATH,
      synced,
      items: randomArticles,
    })
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to load business news from MySQL.' })
  }
})

server.get('/api/world-headlines', async (_request, response) => {
  const apiKey = process.env.RAPIDAPI_KEY || process.env.VITE_RAPIDAPI_KEY
  const mysqlConfig = getMysqlConfig()

  if (!mysqlConfig) {
    response.status(400).json({
      error:
        'MySQL is not configured. Set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD in your environment.',
    })
    return
  }

  try {
    const pool = await getMysqlPool(mysqlConfig)
    await ensureMySqlArticleTable(pool)

    const randomArticles = await listRandomArticlesByEndpoint(pool, WORLD_ENDPOINT_PATH, 9)

    void syncWorldHeadlinesArticlesToMysql(pool, apiKey)

    response.json({
      source: 'mysql',
      endpointPath: WORLD_ENDPOINT_PATH,
      synced: {
        attempted: 0,
        inserted: 0,
        updated: 0,
        status: 'scheduled',
      },
      items: randomArticles,
    })
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to load world headlines from MySQL.' })
  }
})

server.get('/api/news-coverage', async (_request, response) => {
  const apiKey = process.env.RAPIDAPI_KEY || process.env.VITE_RAPIDAPI_KEY
  const mysqlConfig = getMysqlConfig()

  if (!mysqlConfig) {
    response.status(400).json({
      error:
        'MySQL is not configured. Set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD in your environment.',
    })
    return
  }

  try {
    const pool = await getMysqlPool(mysqlConfig)
    await ensureMySqlArticleTable(pool)

    const randomArticles = await listRandomArticlesByEndpoint(pool, COVERAGE_ENDPOINT_PATH, 9)

    void syncNewsCoverageArticlesToMysql(pool, apiKey)

    response.json({
      source: 'mysql',
      endpointPath: COVERAGE_ENDPOINT_PATH,
      synced: {
        attempted: 0,
        inserted: 0,
        updated: 0,
        status: 'scheduled',
      },
      items: randomArticles,
    })
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to load news coverage from MySQL.' })
  }
})

server.get('/api/mysql/articles/collected-today', async (_request, response) => {
  const mysqlConfig = getMysqlConfig()

  if (!mysqlConfig) {
    response.status(200).json({
      enabled: false,
      count: 0,
      message:
        'MySQL is not configured. Set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD in your environment.',
    })
    return
  }

  try {
    const pool = await getMysqlPool(mysqlConfig)
    await ensureMySqlArticleTable(pool)

    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM news_articles
       WHERE created_at >= CURDATE()
         AND created_at < CURDATE() + INTERVAL 1 DAY`,
    )

    response.status(200).json({
      enabled: true,
      count: Number(rows[0]?.count || 0),
    })
  } catch (error) {
    response.status(502).json({
      enabled: false,
      count: 0,
      error: error.message || 'Unable to count articles collected today.',
    })
  }
})

server.get('/api/mysql/articles/saved-by-day', async (request, response) => {
  const mysqlConfig = getMysqlConfig()
  const requestedDays = Number(request.query.days || 7)
  const days = Math.max(1, Math.min(Number.isFinite(requestedDays) ? requestedDays : 7, 31))
  const endpointPath = normalizeEndpointPath(request.query.endpointPath)

  if (!mysqlConfig) {
    response.status(200).json({
      enabled: false,
      days,
      totalSaved: 0,
      items: [],
      message:
        'MySQL is not configured. Set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD in your environment.',
    })
    return
  }

  try {
    const pool = await getMysqlPool(mysqlConfig)
    await ensureMySqlArticleTable(pool)

    const endpointFilterSql = endpointPath ? 'AND endpoint_path = ?' : ''
    const queryParams = [days]

    if (endpointPath) {
      queryParams.push(endpointPath)
    }

    const [rows] = await pool.query(
      `SELECT
         DATE(created_at) AS saved_date,
         COUNT(*) AS saved_count
       FROM news_articles
       WHERE created_at >= UTC_DATE() - INTERVAL (? - 1) DAY
         AND created_at < UTC_DATE() + INTERVAL 1 DAY
         ${endpointFilterSql}
       GROUP BY DATE(created_at)
       ORDER BY saved_date ASC`,
      queryParams,
    )

    const countByDate = new Map()

    rows.forEach((row) => {
      const dateValue = row.saved_date ? new Date(row.saved_date) : null
      if (!dateValue || Number.isNaN(dateValue.getTime())) {
        return
      }

      const dayKey = dateValue.toISOString().slice(0, 10)
      countByDate.set(dayKey, Number(row.saved_count || 0))
    })

    const items = []
    const todayUtc = new Date()

    for (let index = days - 1; index >= 0; index -= 1) {
      const day = new Date(Date.UTC(todayUtc.getUTCFullYear(), todayUtc.getUTCMonth(), todayUtc.getUTCDate() - index))
      const date = day.toISOString().slice(0, 10)
      items.push({
        date,
        count: countByDate.get(date) || 0,
      })
    }

    const totalSaved = items.reduce((sum, item) => sum + item.count, 0)

    response.status(200).json({
      enabled: true,
      days,
      endpointPath: endpointPath || null,
      totalSaved,
      items,
    })
  } catch (error) {
    response.status(502).json({
      enabled: false,
      days,
      totalSaved: 0,
      items: [],
      error: error.message || 'Unable to load saved article counts by day.',
    })
  }
})

server.get('/api/mysql/comments/revenue', async (_request, response) => {
  const mysqlConfig = getMysqlConfig()

  if (!mysqlConfig) {
    response.status(200).json({
      enabled: false,
      initialCommentCount: 0,
      revenue: 0,
      message:
        'MySQL is not configured. Set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD in your environment.',
    })
    return
  }

  try {
    const pool = await getMysqlPool(mysqlConfig)
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM article_comments
       WHERE parent_comment_id IS NULL
         AND deleted_at IS NULL
         AND status = 'published'`,
    )
    const initialCommentCount = Number(rows[0]?.count || 0)

    response.status(200).json({
      enabled: true,
      initialCommentCount,
      revenue: initialCommentCount,
    })
  } catch (error) {
    if (error && error.code === 'ER_NO_SUCH_TABLE') {
      response.status(200).json({
        enabled: true,
        initialCommentCount: 0,
        revenue: 0,
      })
      return
    }

    response.status(502).json({
      enabled: false,
      initialCommentCount: 0,
      revenue: 0,
      error: error.message || 'Unable to count comment revenue.',
    })
  }
})

server.get('/api/mysql/comments/with-responses', async (_request, response) => {
  const mysqlConfig = getMysqlConfig()

  if (!mysqlConfig) {
    response.status(200).json({
      enabled: false,
      count: 0,
      message:
        'MySQL is not configured. Set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD in your environment.',
    })
    return
  }

  try {
    const pool = await getMysqlPool(mysqlConfig)
    const [rows] = await pool.query(
      `SELECT COUNT(DISTINCT parent.id) AS count
       FROM article_comments parent
       INNER JOIN article_comments response
         ON response.parent_comment_id = parent.id
        AND response.deleted_at IS NULL
        AND response.status = 'published'
       WHERE parent.parent_comment_id IS NULL
         AND parent.deleted_at IS NULL
         AND parent.status = 'published'`,
    )

    response.status(200).json({
      enabled: true,
      count: Number(rows[0]?.count || 0),
    })
  } catch (error) {
    if (error && error.code === 'ER_NO_SUCH_TABLE') {
      response.status(200).json({
        enabled: true,
        count: 0,
      })
      return
    }

    response.status(502).json({
      enabled: false,
      count: 0,
      error: error.message || 'Unable to count comments with responses.',
    })
  }
})

server.get('/api/mysql/comments/without-responses', async (_request, response) => {
  const mysqlConfig = getMysqlConfig()

  if (!mysqlConfig) {
    response.status(200).json({
      enabled: false,
      count: 0,
      message:
        'MySQL is not configured. Set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD in your environment.',
    })
    return
  }

  try {
    const pool = await getMysqlPool(mysqlConfig)
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM article_comments parent
       WHERE parent.parent_comment_id IS NULL
         AND parent.deleted_at IS NULL
         AND parent.status = 'published'
         AND NOT EXISTS (
           SELECT 1
           FROM article_comments response
           WHERE response.parent_comment_id = parent.id
             AND response.deleted_at IS NULL
             AND response.status = 'published'
         )`,
    )

    response.status(200).json({
      enabled: true,
      count: Number(rows[0]?.count || 0),
    })
  } catch (error) {
    if (error && error.code === 'ER_NO_SUCH_TABLE') {
      response.status(200).json({
        enabled: true,
        count: 0,
      })
      return
    }

    response.status(502).json({
      enabled: false,
      count: 0,
      error: error.message || 'Unable to count comments without responses.',
    })
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
    const upstreamDetails = await getUpstreamErrorDetails(apiResponse)
    const error = new Error(
      `RapidAPI request failed with status ${apiResponse.status}${upstreamDetails.body ? `: ${upstreamDetails.body}` : ''}`,
    )
    error.upstreamStatus = apiResponse.status
    error.upstreamStatusText = apiResponse.statusText
    error.upstreamBody = upstreamDetails.body
    throw error
  }

  return apiResponse.json()
}

async function getCachedOrFreshRapidApiPayload(endpointPath, queryParams, apiKey) {
  const cacheKey = createCacheKey(endpointPath, queryParams)
  const cacheCollection = getCacheCollection('rapidApi', endpointPath)
  const cachedEntry = cacheCollection.find({ id: cacheKey }).value()

  if (cachedEntry && !isExpired(cachedEntry.fetchedAt)) {
    return cachedEntry.payload
  }

  if (!apiKey) {
    if (cachedEntry) {
      return cachedEntry.payload
    }

    throw new Error('Missing RapidAPI key. Set RAPIDAPI_KEY or VITE_RAPIDAPI_KEY before starting the cache server.')
  }

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

  return payload
}

async function syncWorldHeadlinesArticlesToMysql(pool, apiKey) {
  try {
    const payload = await getCachedOrFreshRapidApiPayload(WORLD_ENDPOINT_PATH, WORLD_QUERY_PARAMS, apiKey)
    const normalizedArticles = normalizeRapidNewsArticles(payload)
    const { insertedCount, updatedCount } = await saveArticlesToMysql(
      pool,
      normalizedArticles,
      WORLD_ENDPOINT_PATH,
      WORLD_QUERY_PARAMS,
    )

    console.log('[world-headlines] background sync complete', {
      attempted: normalizedArticles.length,
      inserted: insertedCount,
      updated: updatedCount,
    })
  } catch (error) {
    console.error('[world-headlines] background sync failed', {
      message: error?.message,
      upstreamStatus: error?.upstreamStatus,
      upstreamStatusText: error?.upstreamStatusText,
      upstreamBody: error?.upstreamBody,
    })
  }
}

async function syncNewsCoverageArticlesToMysql(pool, apiKey) {
  try {
    const payload = await getCachedOrFreshRapidApiPayload(COVERAGE_ENDPOINT_PATH, COVERAGE_QUERY_PARAMS, apiKey)
    const normalizedArticles = normalizeRapidNewsArticles(payload)
    const { insertedCount, updatedCount } = await saveArticlesToMysql(
      pool,
      normalizedArticles,
      COVERAGE_ENDPOINT_PATH,
      COVERAGE_QUERY_PARAMS,
    )

    console.log('[news-coverage] background sync complete', {
      attempted: normalizedArticles.length,
      inserted: insertedCount,
      updated: updatedCount,
    })
  } catch (error) {
    console.error('[news-coverage] background sync failed', {
      message: error?.message,
      upstreamStatus: error?.upstreamStatus,
      upstreamStatusText: error?.upstreamStatusText,
      upstreamBody: error?.upstreamBody,
    })
  }
}

function normalizeRapidNewsArticles(payload) {
  const articles = Array.isArray(payload?.data)
    ? payload.data
    : payload?.data?.top_news?.all_articles ?? payload?.data?.all_articles ?? []

  return articles
    .map((article) => {
      if (!isPlainObject(article)) {
        return null
      }

      const normalized = {
        ...article,
        article_id: normalizeNullableString(article.article_id || article.link || article.title, 191),
        title: normalizeNullableString(article.title),
        link: normalizeNullableString(article.link),
        snippet: normalizeNullableString(article.snippet || article.description || article.summary),
        source_name: normalizeNullableString(article.source_name, 191),
        published_datetime_utc: parseArticlePublishedDate(article.published_datetime_utc),
        authors: Array.isArray(article.authors) ? article.authors : [],
      }

      if (!normalized.title || !normalized.link) {
        return null
      }

      return normalized
    })
    .filter(Boolean)
}

async function fetchGoogleBusinessNews(apiKey) {
  const queryString = new URLSearchParams(BUSINESS_QUERY_PARAMS).toString()
  const requestUrl = `https://${GOOGLE_NEWS_API_HOST}${BUSINESS_ENDPOINT_PATH}${queryString ? `?${queryString}` : ''}`

  const apiResponse = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': GOOGLE_NEWS_API_HOST,
      'x-rapidapi-key': apiKey,
    },
  })

  if (!apiResponse.ok) {
    const upstreamDetails = await getUpstreamErrorDetails(apiResponse)
    const error = new Error(
      `Google business news request failed with status ${apiResponse.status}${upstreamDetails.body ? `: ${upstreamDetails.body}` : ''}`,
    )
    error.upstreamStatus = apiResponse.status
    error.upstreamStatusText = apiResponse.statusText
    error.upstreamBody = upstreamDetails.body
    throw error
  }

  return apiResponse.json()
}

function normalizeGoogleBusinessArticles(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : []
  const flattenedItems = []

  items.forEach((item) => {
    flattenedItems.push(item)

    const subnewsItems = Array.isArray(item?.subnews) ? item.subnews : []
    subnewsItems.forEach((subnewsItem) => {
      flattenedItems.push(subnewsItem)
    })
  })

  return flattenedItems
    .map((item) => {
      const publishedAtUtc = parseBusinessTimestamp(item?.timestamp)
      const normalized = {
        article_id: normalizeNullableString(item?.newsUrl || item?.title, 191),
        title: normalizeNullableString(item?.title),
        link: normalizeNullableString(item?.newsUrl),
        snippet: normalizeNullableString(item?.snippet),
        source_name: normalizeNullableString(item?.publisher, 191),
        published_datetime_utc: publishedAtUtc,
        authors: [],
      }

      if (!normalized.title || !normalized.link) {
        return null
      }

      return normalized
    })
    .filter(Boolean)
}

function parseBusinessTimestamp(value) {
  const normalized = normalizeNullableString(value, 32)
  if (!normalized) {
    return null
  }

  const numericValue = Number(normalized)
  if (Number.isFinite(numericValue)) {
    const dateValue = new Date(numericValue)
    if (!Number.isNaN(dateValue.getTime())) {
      return dateValue.toISOString()
    }
  }

  const parsedDate = new Date(normalized)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate.toISOString()
}

async function getUpstreamErrorDetails(apiResponse) {
  try {
    const bodyText = await apiResponse.text()
    return {
      body: normalizeNullableString(bodyText, 500),
    }
  } catch (_error) {
    return {
      body: '',
    }
  }
}

async function saveArticlesToMysql(pool, articles, endpointPath, queryParams) {
  let insertedCount = 0
  let updatedCount = 0

  for (const article of articles) {
    const articleHash = computeArticleHash(article)
    const authors = Array.isArray(article.authors) ? article.authors : []
    const publishedAtUtc = parseArticlePublishedDate(article.published_datetime_utc)

    const [result] = await pool.execute(
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        article_id = VALUES(article_id),
        title = VALUES(title),
        link = VALUES(link),
        snippet = VALUES(snippet),
        source_name = VALUES(source_name),
        published_datetime_utc = VALUES(published_datetime_utc),
        authors_json = VALUES(authors_json),
        endpoint_path = VALUES(endpoint_path),
        query_params_json = VALUES(query_params_json),
        raw_article_json = VALUES(raw_article_json),
        updated_at = CURRENT_TIMESTAMP`,
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

    if (result.affectedRows === 1) {
      insertedCount += 1
    } else if (result.affectedRows >= 2) {
      updatedCount += 1
    }
  }

  return { insertedCount, updatedCount }
}

async function listRandomArticlesByEndpoint(pool, endpointPath, limit) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 9, 100))
  const sampleLimit = Math.min(Math.max(safeLimit * 5, safeLimit), 500)
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
      raw_article_json,
      created_at,
      updated_at
    FROM news_articles
    WHERE endpoint_path = ?
    ORDER BY RAND()
    LIMIT ${sampleLimit}`,
    [endpointPath],
  )

  const distinctArticles = []
  const seenArticleKeys = new Set()

  for (const row of rows) {
    const article = normalizeMySqlArticleRow(row)
    const articleKey = getDistinctArticleKey(article)

    if (seenArticleKeys.has(articleKey)) {
      continue
    }

    seenArticleKeys.add(articleKey)
    distinctArticles.push(article)

    if (distinctArticles.length >= safeLimit) {
      break
    }
  }

  return distinctArticles
}

function getDistinctArticleKey(article) {
  const canonicalUrl = getCanonicalArticleUrl(article.link)
  if (canonicalUrl) {
    return `link:${canonicalUrl}`
  }

  const titleKey = normalizeArticleTitleKey(article.title)
  if (titleKey) {
    return `title:${titleKey}`
  }

  return `hash:${article.article_hash || article.article_id || ''}`
}

function getCanonicalArticleUrl(value) {
  const normalized = normalizeNullableString(value)
  if (!normalized) {
    return ''
  }

  try {
    const parsedUrl = new URL(normalized)
    parsedUrl.hash = ''

    for (const key of [...parsedUrl.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(key)) {
        parsedUrl.searchParams.delete(key)
      }
    }

    parsedUrl.hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '')
    return parsedUrl.toString().replace(/\/$/, '')
  } catch {
    return normalized.toLowerCase().replace(/\s+/g, ' ').replace(/\/$/, '')
  }
}

function normalizeArticleTitleKey(value) {
  return normalizeNullableString(value)?.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() || ''
}

function normalizeMySqlArticleRow(row) {
  const rawArticle = safeJsonParseObject(row.raw_article_json)

  return {
    article_hash: row.article_hash,
    article_id: row.article_id,
    title: row.title,
    link: row.link,
    snippet: row.snippet,
    photo_url: rawArticle.photo_url || null,
    thumbnail_url: rawArticle.thumbnail_url || null,
    source_url: rawArticle.source_url || null,
    source_logo_url: rawArticle.source_logo_url || null,
    source_favicon_url: rawArticle.source_favicon_url || null,
    source_name: row.source_name,
    published_datetime_utc: row.published_datetime_utc,
    authors: safeJsonParseArray(row.authors_json),
    endpoint_path: row.endpoint_path,
    query_params: safeJsonParseObject(row.query_params_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function safeJsonParseArray(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeJsonParseObject(value) {
  try {
    const parsed = JSON.parse(value || '{}')
    return isPlainObject(parsed) ? parsed : {}
  } catch {
    return {}
  }
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

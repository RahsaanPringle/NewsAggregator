const fs = require('node:fs')
const path = require('node:path')
const dotenv = require('dotenv')
const jsonServer = require('json-server')

const PORT = Number(process.env.JSON_SERVER_PORT || 4000)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const RAPID_API_HOST = 'real-time-news-data.p.rapidapi.com'
const DB_FILE_PATH = path.join(__dirname, 'db.json')

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
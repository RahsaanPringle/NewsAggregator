import { useCallback, useEffect, useMemo, useState } from 'react'
import { openNewsPopup } from '../utils/openNewsPopup'

const MYSQL_API_BASE_URL = String(import.meta.env.VITE_NEWS_API_BASE_URL || '').trim().replace(/\/+$/, '')
const WORLD_ENDPOINT_PATH = '/topic-headlines'
const WORLD_QUERY_PARAMS = {
  topic: 'WORLD',
  limit: 500,
  country: 'US',
  lang: 'en',
}
const GRID_ROW_SLOTS = 3
const MAX_GRID_ROWS = 3
const MAX_GRID_SLOTS = GRID_ROW_SLOTS * MAX_GRID_ROWS

function normalizeArticles(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  return payload?.data?.top_news?.all_articles ?? payload?.data?.all_articles ?? []
}

function buildNewsApiUrl() {
  const searchParams = new URLSearchParams({ endpointPath: WORLD_ENDPOINT_PATH })

  Object.entries(WORLD_QUERY_PARAMS).forEach(([key, value]) => {
    searchParams.append(key, String(value))
  })

  return `/api/news?${searchParams.toString()}`
}

function buildMysqlApiUrl(routePath) {
  return MYSQL_API_BASE_URL ? `${MYSQL_API_BASE_URL}${routePath}` : routePath
}

function randomizeArticles(items) {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const value = next[index]
    next[index] = next[randomIndex]
    next[randomIndex] = value
  }

  return next
}

function formatPublishedDate(value) {
  if (!value) {
    return 'Unknown publish date'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)
}

function getCardSlotWidth(isSavedCard) {
  return isSavedCard ? 2 : 1
}

function getArticleImageUrl(article) {
  const candidates = [
    article?.photo_url,
    article?.thumbnail_url,
    article?.image_url,
    article?.image,
    article?.imageUrl,
    article?.thumbnail,
    article?.media?.image,
    article?.media?.image_url,
    article?.media?.thumbnail_url,
  ]

  const resolved = candidates.find((value) => typeof value === 'string' && /^https?:\/\//i.test(value.trim()))
  return resolved ? resolved.trim() : ''
}

function DashboardRowThreeWorldHeadlinesCards() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mysqlEnabled, setMysqlEnabled] = useState(false)
  const [articleHashes, setArticleHashes] = useState([])
  const [savedArticleHashes, setSavedArticleHashes] = useState(() => new Set())
  const [savingArticleHashes, setSavingArticleHashes] = useState(() => new Set())
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const abortController = new AbortController()

    async function loadNews() {
      setLoading(true)
      setError('')
      setSaveError('')
      setMysqlEnabled(false)
      setArticleHashes([])
      setSavedArticleHashes(new Set())
      setSavingArticleHashes(new Set())

      try {
        const response = await fetch(buildNewsApiUrl(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setArticles(randomizeArticles(normalizeArticles(payload)))
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load world headlines.')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadNews()

    return () => {
      abortController.abort()
    }
  }, [])

  useEffect(() => {
    const abortController = new AbortController()

    async function loadMysqlStatuses() {
      if (loading || error || !articles.length) {
        return
      }

      try {
        const response = await fetch(buildMysqlApiUrl('/api/mysql/articles/status'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ articles }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`MySQL status request failed with status ${response.status}`)
        }

        const payload = await response.json()
        if (!payload.enabled) {
          return
        }

        setMysqlEnabled(true)
        setArticleHashes(Array.isArray(payload.articleHashes) ? payload.articleHashes : [])
        setSavedArticleHashes(new Set(Array.isArray(payload.existingArticleHashes) ? payload.existingArticleHashes : []))
      } catch (statusError) {
        if (statusError.name !== 'AbortError') {
          setMysqlEnabled(false)
          setArticleHashes([])
          setSavedArticleHashes(new Set())
        }
      }
    }

    void loadMysqlStatuses()

    return () => {
      abortController.abort()
    }
  }, [articles, error, loading])

  const handleAddToDatabase = useCallback(async (article, articleHash) => {
    if (!articleHash || savingArticleHashes.has(articleHash)) {
      return
    }

    setSaveError('')
    setSavingArticleHashes((previousState) => new Set(previousState).add(articleHash))

    try {
      const response = await fetch(buildMysqlApiUrl('/api/mysql/articles'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article,
          endpointPath: WORLD_ENDPOINT_PATH,
          queryParams: WORLD_QUERY_PARAMS,
        }),
      })

      if (!response.ok) {
        throw new Error(`Save request failed with status ${response.status}`)
      }

      const payload = await response.json()
      if (payload.articleHash) {
        setSavedArticleHashes((previousState) => new Set(previousState).add(payload.articleHash))
      }
    } catch (saveRequestError) {
      setSaveError(saveRequestError.message || 'Unable to save article to MySQL.')
    } finally {
      setSavingArticleHashes((previousState) => {
        const nextState = new Set(previousState)
        nextState.delete(articleHash)
        return nextState
      })
    }
  }, [savingArticleHashes])

  const visibleArticles = useMemo(() => {
    const selected = []
    let selectedSlots = 0
    const regularQueue = []
    const wideQueue = []

    for (let articleIndex = 0; articleIndex < articles.length; articleIndex += 1) {
      const article = articles[articleIndex]
      const articleHash = articleHashes[articleIndex]
      const isSaved = articleHash ? savedArticleHashes.has(articleHash) : false
      const nextItem = { article, articleIndex, slotWidth: getCardSlotWidth(isSaved) }

      if (nextItem.slotWidth === 2) {
        wideQueue.push(nextItem)
      } else {
        regularQueue.push(nextItem)
      }
    }

    for (let row = 0; row < MAX_GRID_ROWS; row += 1) {
      let rowSlotsUsed = 0

      while (rowSlotsUsed < GRID_ROW_SLOTS) {
        let nextItem = null

        if (rowSlotsUsed === 0) {
          // A wide card may only start the row and must leave room for a regular card.
          if (wideQueue.length > 0 && regularQueue.length > 0) {
            nextItem = wideQueue.shift() || null
          } else if (regularQueue.length > 0) {
            nextItem = regularQueue.shift() || null
          }
        } else {
          // Prevent wide cards from being the final card in the row.
          if (regularQueue.length > 0) {
            nextItem = regularQueue.shift() || null
          }
        }

        if (!nextItem || rowSlotsUsed + nextItem.slotWidth > GRID_ROW_SLOTS) {
          break
        }

        selected.push(nextItem)
        selectedSlots += nextItem.slotWidth
        rowSlotsUsed += nextItem.slotWidth

        if (selectedSlots >= MAX_GRID_SLOTS) {
          break
        }
      }

      if (selectedSlots >= MAX_GRID_SLOTS) {
        break
      }
    }

    return selected
  }, [articleHashes, articles, savedArticleHashes])

  const cards = useMemo(
    () =>
      visibleArticles.map(({ article, articleIndex }, index) => {
        const articleHash = articleHashes[articleIndex]
        const isSaved = articleHash ? savedArticleHashes.has(articleHash) : false
        const isSaving = articleHash ? savingArticleHashes.has(articleHash) : false
        const imageUrl = getArticleImageUrl(article)
        const columnClassName = isSaved ? 'col-xl-8 col-lg-8 col-md-12 mb-4' : 'col-xl-4 col-lg-4 col-md-6 mb-4'
        const cardClassName = isSaved ? 'card shadow h-100 border-left-success' : 'card shadow h-100 border-left-primary'

        return (
          <div className={columnClassName} key={article.article_id || `${article.title}-${index}`}>
            <div className={cardClassName}>
              {isSaved && imageUrl ? (
                <a
                  href={article.link}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    openNewsPopup(article.link)
                  }}
                >
                  <img
                    src={imageUrl}
                    className="card-img-top"
                    alt={article.title || 'Article image'}
                    loading="lazy"
                    style={{ maxHeight: '240px', objectFit: 'cover' }}
                  />
                </a>
              ) : null}
              <div className="card-body d-flex flex-column">
                <div className="small text-gray-500 mb-2">{article.source_name || 'Unknown source'}</div>
                <h6 className="font-weight-bold mb-2">
                  <a
                    href={article.link}
                    className="text-primary"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      openNewsPopup(article.link)
                    }}
                  >
                    {article.title || 'Untitled article'}
                  </a>
                </h6>
                <div className="small text-gray-600 mb-3">{article.snippet || 'No preview available.'}</div>
                {mysqlEnabled && articleHash && !isSaved ? (
                  <div className="mb-3">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      disabled={isSaving}
                      onClick={() => {
                        void handleAddToDatabase(article, articleHash)
                      }}
                    >
                      {isSaving ? 'Saving...' : 'Add to Database'}
                    </button>
                  </div>
                ) : null}
                <div className="small text-gray-500 mt-auto">{formatPublishedDate(article.published_datetime_utc)}</div>
              </div>
            </div>
          </div>
        )
      }),
    [articleHashes, handleAddToDatabase, mysqlEnabled, savedArticleHashes, savingArticleHashes, visibleArticles],
  )

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 font-weight-bold text-primary">World Headlines Card Grid</h6>
      </div>
      <div className="card-body">
        <div className="small text-gray-500 mb-3">Randomized WORLD topic feed shown as a 3-column card layout.</div>

        {saveError ? (
          <div className="alert alert-warning" role="alert">
            {saveError}
          </div>
        ) : null}

        {error ? (
          <div className="alert alert-warning mb-0" role="alert">
            {error}
          </div>
        ) : loading ? (
          <div className="text-center text-gray-500 py-4">Loading world headlines...</div>
        ) : cards.length > 0 ? (
          <div className="row">{cards}</div>
        ) : (
          <div className="text-center text-gray-500 py-4">No headlines returned for this topic.</div>
        )}
      </div>
    </div>
  )
}

export default DashboardRowThreeWorldHeadlinesCards

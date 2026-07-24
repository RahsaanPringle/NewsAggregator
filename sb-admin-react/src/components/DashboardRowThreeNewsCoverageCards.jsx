import { useEffect, useMemo, useState } from 'react'
import SavedArticleCommentSection from './SavedArticleCommentSection'
import { buildArticlePath } from '../utils/articleLinks'
import { openNewsPopup } from '../utils/openNewsPopup'
import { buildNewsApiUrl } from '../utils/newsApi'

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

function getArticlePreviewText(article) {
  const candidates = [article?.snippet, article?.description, article?.summary, article?.content, article?.text]
  const resolved = candidates.find((value) => typeof value === 'string' && value.trim())

  return resolved ? resolved.trim() : 'No preview available.'
}

function DashboardRowThreeNewsCoverageCards() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncStatus, setSyncStatus] = useState({ attempted: 0, inserted: 0, updated: 0, status: 'idle' })
  const [selectedCommentArticle, setSelectedCommentArticle] = useState(null)
  const [commentsByArticleHash, setCommentsByArticleHash] = useState({})

  useEffect(() => {
    const abortController = new AbortController()

    async function loadCoverageArticles() {
      setLoading(true)
      setError('')
      setSelectedCommentArticle(null)
      setCommentsByArticleHash({})

      try {
        const response = await fetch(buildNewsApiUrl('/api/news-coverage'), {
          method: 'GET',
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`News coverage sync request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setArticles(Array.isArray(payload.items) ? payload.items : [])
        setSyncStatus(payload.synced || { attempted: 0, inserted: 0, updated: 0, status: 'idle' })
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load news coverage from the database.')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadCoverageArticles()

    return () => {
      abortController.abort()
    }
  }, [])

  useEffect(() => {
    const abortController = new AbortController()
    const articleHashes = articles.map((article) => article.article_hash).filter(Boolean)

    if (!articleHashes.length) {
      setCommentsByArticleHash({})
      return () => {
        abortController.abort()
      }
    }

    async function loadCommentSummaries() {
      try {
        const summaryEntries = await Promise.all(
          articleHashes.map(async (articleHash) => {
            const response = await fetch(buildNewsApiUrl(`/api/articles/${articleHash}/comments`), {
              method: 'GET',
              signal: abortController.signal,
            })

            if (!response.ok) {
              throw new Error(`Comment summary request failed with status ${response.status}`)
            }

            const payload = await response.json()
            return [articleHash, Array.isArray(payload.items) ? payload.items : []]
          }),
        )

        setCommentsByArticleHash(Object.fromEntries(summaryEntries))
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setCommentsByArticleHash({})
        }
      }
    }

    void loadCommentSummaries()

    return () => {
      abortController.abort()
    }
  }, [articles])

  function handleCommentCreated(articleHash, createdComment) {
    if (!articleHash || !createdComment) {
      return
    }

    setCommentsByArticleHash((previousState) => {
      const existingComments = Array.isArray(previousState[articleHash]) ? previousState[articleHash] : []
      return {
        ...previousState,
        [articleHash]: [...existingComments, createdComment],
      }
    })
  }

  const cards = useMemo(
    () =>
      articles.slice(0, 9).map((article, index) => {
        const articleHash = article.article_hash
        const articleComments = articleHash ? commentsByArticleHash[articleHash] || [] : []
        const imageUrl = getArticleImageUrl(article)

        return (
          <div className="col-4 mb-4" key={articleHash || article.article_id || `${article.title}-${index}`}>
            <div className="card shadow h-100 border-left-success">
              {imageUrl ? (
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
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      openNewsPopup(article.link)
                    }}
                    className="text-primary"
                  >
                    {article.title || 'Untitled article'}
                  </a>
                </h6>
                <div className="small text-gray-600 mb-3">{getArticlePreviewText(article)}</div>

                {articleHash ? (
                  <SavedArticleCommentSection
                    articleHash={articleHash}
                    articleTitle={article.title || articleHash}
                    articleComments={articleComments}
                    selectedCommentArticle={selectedCommentArticle}
                    onOpenComment={setSelectedCommentArticle}
                    onCloseComment={() => setSelectedCommentArticle(null)}
                    onCommentCreated={handleCommentCreated}
                  />
                ) : null}

                <div className="small text-gray-500 mt-auto">{formatPublishedDate(article.published_datetime_utc)}</div>
              </div>
            </div>
          </div>
        )
      }),
    [articles, commentsByArticleHash, selectedCommentArticle],
  )

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 font-weight-bold text-primary">News Coverage (Database Random 9)</h6>
      </div>
      <div className="card-body">
        <div className="small text-gray-500 mb-3">
          Loaded from random MySQL rows while the full-story coverage feed refreshes in the background.
        </div>
        <div className="small text-gray-600 mb-3">
          Background sync: {syncStatus.status === 'scheduled' ? 'scheduled' : 'waiting'}.
        </div>

        {error ? (
          <div className="alert alert-warning mb-0" role="alert">
            {error}
          </div>
        ) : loading ? (
          <div className="text-center text-gray-500 py-4">Loading news coverage from the database...</div>
        ) : cards.length > 0 ? (
          <div className="row">{cards}</div>
        ) : (
          <div className="text-center text-gray-500 py-4">No news coverage articles were found in the database.</div>
        )}
      </div>
    </div>
  )
}

export default DashboardRowThreeNewsCoverageCards

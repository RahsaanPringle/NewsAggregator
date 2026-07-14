import { useEffect, useMemo, useState } from 'react'
import SavedArticleCommentSection from './SavedArticleCommentSection'
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

function BusinessArticleImage({ article, imageUrl }) {
  const [imageFailed, setImageFailed] = useState(false)

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        className="card-img-top"
        alt={article.title || 'Article image'}
        loading="lazy"
        onError={() => setImageFailed(true)}
        style={{ height: '200px', objectFit: 'cover' }}
      />
    )
  }

  return (
    <div
      className="card-img-top d-flex flex-column align-items-center justify-content-center text-white text-center px-3"
      role="img"
      aria-label={`${article.source_name || 'Business News'} article image unavailable`}
      style={{
        height: '200px',
        background: 'linear-gradient(135deg, #1cc88a 0%, #0f6848 100%)',
      }}
    >
      <i className="fas fa-chart-line fa-3x mb-3" aria-hidden="true" />
      <span className="font-weight-bold">{article.source_name || 'Business News'}</span>
    </div>
  )
}

function DashboardRowThreeBusinessNewsCards() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncStatus, setSyncStatus] = useState({ attempted: 0, inserted: 0, updated: 0 })
  const [selectedCommentArticle, setSelectedCommentArticle] = useState(null)
  const [commentsByArticleHash, setCommentsByArticleHash] = useState({})

  useEffect(() => {
    const abortController = new AbortController()

    async function loadBusinessArticles() {
      setLoading(true)
      setError('')
      setSelectedCommentArticle(null)
      setCommentsByArticleHash({})

      try {
        const response = await fetch(buildNewsApiUrl('/api/business-news'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Business sync request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setArticles(Array.isArray(payload.items) ? payload.items : [])
        setSyncStatus(payload.synced || { attempted: 0, inserted: 0, updated: 0 })
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load business news from the database.')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadBusinessArticles()

    return () => {
      abortController.abort()
    }
  }, [])

  useEffect(() => {
    const abortController = new AbortController()
    const articleHashes = articles.map((article) => article.article_hash).filter(Boolean)

    if (!articleHashes.length) {
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
              headers: {
                'Content-Type': 'application/json',
              },
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
        const hasComments = articleComments.length > 0
        const columnClassName = hasComments ? 'col-12 mb-4' : 'col-xl-4 col-lg-4 col-md-6 mb-4'

        return (
          <div className={columnClassName} key={articleHash || article.article_id || `${article.title}-${index}`}>
            <div className="card shadow h-100 border-left-success">
              <a
                href={article.link}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  openNewsPopup(article.link)
                }}
              >
                <BusinessArticleImage key={imageUrl || 'fallback'} article={article} imageUrl={imageUrl} />
              </a>
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
        <h6 className="m-0 font-weight-bold text-primary">Business News (Database Random 9)</h6>
      </div>
      <div className="card-body">
        <div className="small text-gray-500 mb-3">
          Synced from google-news13, auto-saved to MySQL, and displayed from random rows in the database.
        </div>
        <div className="small text-gray-600 mb-3">
          Sync summary: {syncStatus.attempted} attempted, {syncStatus.inserted} inserted, {syncStatus.updated} updated.
        </div>

        {error ? (
          <div className="alert alert-warning mb-0" role="alert">
            {error}
          </div>
        ) : loading ? (
          <div className="text-center text-gray-500 py-4">Syncing business news and loading database articles...</div>
        ) : cards.length > 0 ? (
          <div className="row">{cards}</div>
        ) : (
          <div className="text-center text-gray-500 py-4">No business articles were found in the database.</div>
        )}
      </div>
    </div>
  )
}

export default DashboardRowThreeBusinessNewsCards

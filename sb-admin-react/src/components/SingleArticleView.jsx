import { useEffect, useMemo, useState } from 'react'
import ArticleCommentsPanel from './ArticleCommentsPanel'
import { buildArticlePath } from '../utils/articleLinks'
import { buildNewsApiUrl } from '../utils/newsApi'
import { openNewsPopup } from '../utils/openNewsPopup'
import './SingleArticleView.css'

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

  return resolved ? resolved.trim() : 'No short description is available for this article.'
}

function getArticleCategory(article) {
  const topic = article?.query_params?.topic
  if (typeof topic === 'string' && topic.trim()) {
    return topic.trim()
  }

  const endpointPath = typeof article?.endpoint_path === 'string' ? article.endpoint_path : ''
  if (!endpointPath) {
    return 'News'
  }

  return endpointPath
    .replace(/^\//, '')
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function RelatedArticleLink({ article }) {
  const imageUrl = getArticleImageUrl(article)
  const title = article?.title || 'Untitled article'

  return (
    <article className="single-related-item">
      <a href={buildArticlePath(article.article_hash)} className="single-related-image-link">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="single-related-image" loading="lazy" />
        ) : (
          <div className="single-related-image single-related-image-fallback" aria-hidden="true" />
        )}
      </a>
      <div className="single-related-body">
        <a href={buildArticlePath(article.article_hash)} className="single-related-title">
          {title}
        </a>
        <div className="single-related-meta">{article.source_name || 'Unknown source'}</div>
      </div>
    </article>
  )
}

function SingleArticleView({ articleHash }) {
  const [article, setArticle] = useState(null)
  const [relatedArticles, setRelatedArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const abortController = new AbortController()

    async function loadArticle() {
      setLoading(true)
      setError('')
      setArticle(null)
      setRelatedArticles([])

      try {
        const response = await fetch(buildNewsApiUrl(`/api/articles/${encodeURIComponent(articleHash)}?relatedLimit=5`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Article request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setArticle(payload.item || null)
        setRelatedArticles(Array.isArray(payload.relatedItems) ? payload.relatedItems : [])
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load this article.')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    if (articleHash) {
      void loadArticle()
    }

    return () => {
      abortController.abort()
    }
  }, [articleHash])

  const imageUrl = getArticleImageUrl(article)
  const relatedList = useMemo(
    () => relatedArticles.map((relatedArticle) => <RelatedArticleLink article={relatedArticle} key={relatedArticle.article_hash || relatedArticle.link} />),
    [relatedArticles],
  )

  if (loading) {
    return <div className="single-article-loading">Loading article...</div>
  }

  if (error) {
    return (
      <div className="alert alert-warning" role="alert">
        {error}
      </div>
    )
  }

  if (!article) {
    return <div className="single-article-loading">Article was not found.</div>
  }

  return (
    <div className="single-article-page">
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <a href="/" className="btn btn-sm btn-outline-secondary">
          <i className="fas fa-arrow-left fa-sm mr-1"></i> Back to Dashboard
        </a>
        {article.link ? (
          <button
            type="button"
            className="btn btn-sm btn-primary shadow-sm mt-2 mt-sm-0"
            onClick={() => openNewsPopup(article.link)}
          >
            <i className="fas fa-external-link-alt fa-sm text-white-50 mr-1"></i> Original Article
          </button>
        ) : null}
      </div>

      <div className="single-article-layout">
        <main className="single-article-main">
          <article className="single-article-card">
            <div className="single-article-hero">
              {imageUrl ? (
                <img src={imageUrl} alt={article.title || 'Article image'} className="single-article-hero-image" />
              ) : (
                <div className="single-article-hero-image single-article-hero-fallback" aria-hidden="true" />
              )}
              <div className="single-article-hero-overlay">
                <div className="single-article-kicker">{getArticleCategory(article)}</div>
                <h1>{article.title || 'Untitled article'}</h1>
                <div className="single-article-meta">
                  <span>{article.source_name || 'Unknown source'}</span>
                  <span>{formatPublishedDate(article.published_datetime_utc)}</span>
                </div>
              </div>
            </div>

            <div className="single-article-content">
              <p className="single-article-description">{getArticlePreviewText(article)}</p>
              {article.authors?.length ? (
                <div className="single-article-authors">By {article.authors.join(', ')}</div>
              ) : null}
            </div>
          </article>

          <ArticleCommentsPanel
            articleHash={article.article_hash}
            articleTitle={article.title || article.article_hash}
            showCloseButton={false}
            className="card shadow mt-4"
            onClose={() => {}}
          />
        </main>

        <aside className="single-article-aside" aria-label="Related articles">
          <div className="card shadow">
            <div className="card-header py-3">
              <h2 className="h6 m-0 font-weight-bold text-primary">Related Articles</h2>
            </div>
            <div className="card-body">
              {relatedList.length ? relatedList : <div className="small text-gray-500">No related articles were found.</div>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default SingleArticleView

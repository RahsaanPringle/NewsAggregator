import { useEffect, useMemo, useState } from 'react'
import { buildArticlePath } from '../utils/articleLinks'
import './DashboardHeroArticles.css'

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

  return resolved ? resolved.trim() : ''
}

function getArticleCategory(article) {
  const topic = article?.query_params?.topic
  if (typeof topic === 'string' && topic.trim()) {
    return topic.trim()
  }

  const endpointPath = typeof article?.endpoint_path === 'string' ? article.endpoint_path : ''
  if (endpointPath) {
    return endpointPath
      .replace(/^\//, '')
      .split('-')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ')
  }

  return article?.source_name || 'News'
}

function getArticleKey(article, index) {
  return article.article_hash || article.article_id || article.link || `${article.title}-${index}`
}

function DashboardHeroTile({ article, featured }) {
  const imageUrl = getArticleImageUrl(article)
  const previewText = getArticlePreviewText(article)
  const category = getArticleCategory(article)
  const title = article?.title || 'Untitled article'
  const articlePath = buildArticlePath(article?.article_hash)

  return (
    <article className={featured ? 'news-hero-tile news-hero-tile-featured' : 'news-hero-tile'}>
      <a href={articlePath} className="news-hero-link">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="news-hero-image" loading={featured ? 'eager' : 'lazy'} />
        ) : (
          <div className="news-hero-image news-hero-image-fallback" aria-hidden="true" />
        )}
        <div className="news-hero-overlay">
          <h2 className={featured ? 'news-hero-title news-hero-title-featured' : 'news-hero-title'}>{title}</h2>
          {featured && previewText ? <p className="news-hero-preview">{previewText}</p> : null}
          <div className="news-hero-meta">
            <span className="news-hero-accent" aria-hidden="true" />
            <span>{category}</span>
            {article.source_name ? <span className="news-hero-source">{article.source_name}</span> : null}
          </div>
        </div>
      </a>
    </article>
  )
}

function DashboardHeroArticles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const abortController = new AbortController()

    async function loadHeroArticles() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/hero-articles?limit=5&poolLimit=80', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Hero articles request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setArticles(Array.isArray(payload.items) ? payload.items : [])
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load hero articles.')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadHeroArticles()

    return () => {
      abortController.abort()
    }
  }, [])

  const heroTiles = useMemo(
    () =>
      articles.slice(0, 5).map((article, index) => (
        <DashboardHeroTile article={article} featured={index === 0} key={getArticleKey(article, index)} />
      )),
    [articles],
  )

  if (error) {
    return (
      <div className="alert alert-warning mb-4" role="alert">
        {error}
      </div>
    )
  }

  if (loading) {
    return <div className="news-hero-loading mb-4">Loading featured articles...</div>
  }

  if (!heroTiles.length) {
    return <div className="news-hero-loading mb-4">No cached articles are available for the hero.</div>
  }

  return <section className="news-hero-grid mb-4" aria-label="Featured articles">{heroTiles}</section>
}

export default DashboardHeroArticles

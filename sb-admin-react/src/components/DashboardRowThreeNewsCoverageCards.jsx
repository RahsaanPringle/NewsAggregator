import { useMemo } from 'react'
import SavedArticleCommentSection from './SavedArticleCommentSection'
import useNewsCardGridData from './useNewsCardGridData'
import { openNewsPopup } from '../utils/openNewsPopup'

const COVERAGE_ENDPOINT_PATH = '/full-story-coverage'
const COVERAGE_QUERY_PARAMS = {
  story: 'CAAqNggKIjBDQklTSGpvSmMzUnZjbmt0TXpZd1NoRUtEd2pibk5UN0VCSDVpWndxM3pJc0hDZ0FQAQ',
  sort: 'RELEVANCE',
  country: 'US',
  lang: 'en',
}
const GRID_ROW_SLOTS = 3
const MAX_GRID_ROWS = 3
const MAX_GRID_SLOTS = GRID_ROW_SLOTS * MAX_GRID_ROWS

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

function getCardSlotWidth(isSavedCard, commentCount) {
  if (commentCount > 0) {
    return 3
  }

  return isSavedCard ? 2 : 1
}

function getColumnClassName(slotWidth) {
  if (slotWidth >= 3) {
    return 'col-12 mb-4'
  }

  if (slotWidth === 2) {
    return 'col-xl-8 col-lg-8 col-md-12 mb-4'
  }

  return 'col-xl-4 col-lg-4 col-md-6 mb-4'
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

function DashboardRowThreeNewsCoverageCards() {
  const {
    articles,
    loading,
    error,
    mysqlEnabled,
    articleHashes,
    savedArticleHashes,
    savingArticleHashes,
    saveError,
    selectedCommentArticle,
    commentsByArticleHash,
    setSelectedCommentArticle,
    handleAddToDatabase,
    handleCommentCreated,
  } = useNewsCardGridData({
    endpointPath: COVERAGE_ENDPOINT_PATH,
    queryParams: COVERAGE_QUERY_PARAMS,
    loadErrorLabel: 'Unable to load story coverage.',
  })

  const visibleArticles = useMemo(() => {
    const selected = []
    let selectedSlots = 0
    const regularQueue = []
    const wideQueue = []
    const fullQueue = []

    for (let articleIndex = 0; articleIndex < articles.length; articleIndex += 1) {
      const article = articles[articleIndex]
      const articleHash = articleHashes[articleIndex]
      const isSaved = articleHash ? savedArticleHashes.has(articleHash) : false
      const commentCount = articleHash ? (commentsByArticleHash[articleHash] || []).length : 0
      const nextItem = { article, articleIndex, slotWidth: getCardSlotWidth(isSaved, commentCount) }

      if (nextItem.slotWidth === 3) {
        fullQueue.push(nextItem)
      } else if (nextItem.slotWidth === 2) {
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
          if (fullQueue.length > 0) {
            nextItem = fullQueue.shift() || null
          } else if (wideQueue.length > 0 && regularQueue.length > 0) {
            nextItem = wideQueue.shift() || null
          } else if (regularQueue.length > 0) {
            nextItem = regularQueue.shift() || null
          }
        } else if (rowSlotsUsed === 1) {
          if (wideQueue.length > 0) {
            nextItem = wideQueue.shift() || null
          } else if (regularQueue.length > 0) {
            nextItem = regularQueue.shift() || null
          }
        } else if (regularQueue.length > 0) {
          nextItem = regularQueue.shift() || null
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
  }, [articleHashes, articles, commentsByArticleHash, savedArticleHashes])

  const cards = useMemo(
    () =>
      visibleArticles.map(({ article, articleIndex }, index) => {
        const articleHash = articleHashes[articleIndex]
        const isSaved = articleHash ? savedArticleHashes.has(articleHash) : false
        const isSaving = articleHash ? savingArticleHashes.has(articleHash) : false
        const articleComments = articleHash ? commentsByArticleHash[articleHash] || [] : []
        const slotWidth = getCardSlotWidth(isSaved, articleComments.length)
        const imageUrl = getArticleImageUrl(article)
        const columnClassName = getColumnClassName(slotWidth)
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
                ) : isSaved && articleHash ? (
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
    [articleHashes, commentsByArticleHash, handleAddToDatabase, handleCommentCreated, mysqlEnabled, savedArticleHashes, savingArticleHashes, selectedCommentArticle, visibleArticles],
  )

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 font-weight-bold text-primary">News Coverage Card Grid</h6>
      </div>
      <div className="card-body">
        <div className="small text-gray-500 mb-3">Randomized full-story coverage feed shown as a 3-column card layout.</div>

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
          <div className="text-center text-gray-500 py-4">Loading story coverage...</div>
        ) : cards.length > 0 ? (
          <div className="row">{cards}</div>
        ) : (
          <div className="text-center text-gray-500 py-4">No articles returned for this story.</div>
        )}
      </div>
    </div>
  )
}

export default DashboardRowThreeNewsCoverageCards

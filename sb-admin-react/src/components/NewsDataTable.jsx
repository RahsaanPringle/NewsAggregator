import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ArticleCommentsPanel from './ArticleCommentsPanel'
import { buildArticlePath } from '../utils/articleLinks'
import { openNewsPopup } from '../utils/openNewsPopup'

const DEFAULT_COLUMNS = ['Headline', 'Source', 'Published', 'Authors']
const MYSQL_API_BASE_URL = String(import.meta.env.VITE_NEWS_API_BASE_URL || '').trim().replace(/\/+$/, '')

function formatPublishedDate(value) {
  if (!value) {
    return 'Unknown'
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

function normalizeArticles(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  return payload?.data?.top_news?.all_articles ?? payload?.data?.all_articles ?? []
}

function buildLocalApiUrl(endpointPath, queryParams = {}) {
  const searchParams = new URLSearchParams({ endpointPath })

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  return `/api/news?${searchParams.toString()}`
}

function buildMysqlApiUrl(routePath) {
  return MYSQL_API_BASE_URL ? `${MYSQL_API_BASE_URL}${routePath}` : routePath
}

function getActionTarget(eventTarget) {
  return eventTarget instanceof Element ? eventTarget.closest('[data-news-action]') : null
}

function getSavedArticleHashes(articleHashes, savedArticleHashes) {
  return articleHashes.filter((articleHash) => articleHash && savedArticleHashes.has(articleHash))
}

function NewsDataTable({
  scriptsReady,
  title,
  subtitle,
  endpointPath,
  queryParams,
  tableId,
  loadingLabel,
  emptyLabel,
  errorLabel,
}) {
  const tableRef = useRef(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mysqlEnabled, setMysqlEnabled] = useState(false)
  const [articleHashes, setArticleHashes] = useState([])
  const [savedArticleHashes, setSavedArticleHashes] = useState(() => new Set())
  const [statusLoading, setStatusLoading] = useState(false)
  const [savingArticleHashes, setSavingArticleHashes] = useState(() => new Set())
  const [saveError, setSaveError] = useState('')
  const [selectedCommentArticle, setSelectedCommentArticle] = useState(null)
  const [commentsByArticleHash, setCommentsByArticleHash] = useState({})

  const requestUrl = useMemo(() => {
    return buildLocalApiUrl(endpointPath, queryParams)
  }, [endpointPath, queryParams])

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
      setSelectedCommentArticle(null)
      setCommentsByArticleHash({})

      try {
        const response = await fetch(requestUrl, {
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
        setArticles(normalizeArticles(payload))
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError(fetchError.message || errorLabel || 'Unable to load news coverage.')
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
  }, [errorLabel, requestUrl])

  useEffect(() => {
    const abortController = new AbortController()

    async function loadMysqlStatuses() {
      if (loading || error || !articles.length) {
        setStatusLoading(false)
        return
      }

      setStatusLoading(true)

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
          setMysqlEnabled(false)
          setArticleHashes([])
          setSavedArticleHashes(new Set())
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
      } finally {
        if (!abortController.signal.aborted) {
          setStatusLoading(false)
        }
      }
    }

    void loadMysqlStatuses()

    return () => {
      abortController.abort()
    }
  }, [articles, error, loading])

  useEffect(() => {
    const abortController = new AbortController()
    const savedHashes = getSavedArticleHashes(articleHashes, savedArticleHashes)

    if (!mysqlEnabled || savedHashes.length === 0) {
      setCommentsByArticleHash({})
      return () => {
        abortController.abort()
      }
    }

    async function loadCommentSummaries() {
      try {
        const summaryEntries = await Promise.all(
          savedHashes.map(async (articleHash) => {
            const response = await fetch(buildMysqlApiUrl(`/api/articles/${articleHash}/comments`), {
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
  }, [articleHashes, mysqlEnabled, savedArticleHashes])

  useEffect(() => {
    const tableElement = tableRef.current
    const dataTableApi = window.jQuery?.fn?.dataTable

    if (!scriptsReady || !tableElement || !dataTableApi || loading || error) {
      return undefined
    }

    const tableInstance = window.jQuery(tableElement)

    if (dataTableApi.isDataTable(tableElement)) {
      tableInstance.DataTable().destroy(true)
    }

    tableInstance.DataTable({
      pageLength: 5,
      lengthMenu: [5, 10, 25, 50],
      order: [[2, 'desc']],
      responsive: true,
      autoWidth: false,
    })

    return () => {
      if (dataTableApi.isDataTable(tableElement)) {
        tableInstance.DataTable().destroy(true)
      }
    }
  }, [articles, error, loading, scriptsReady])

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
          endpointPath,
          queryParams,
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
  }, [endpointPath, queryParams, savingArticleHashes])

  const handleCommentCreated = useCallback((articleHash, createdComment) => {
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
  }, [])

  useEffect(() => {
    const tableElement = tableRef.current
    if (!tableElement) {
      return undefined
    }

    function handleTableClick(event) {
      const actionTarget = getActionTarget(event.target)
      if (!actionTarget || !tableElement.contains(actionTarget)) {
        return
      }

      const rowIndex = Number.parseInt(actionTarget.getAttribute('data-row-index') || '', 10)
      if (Number.isNaN(rowIndex)) {
        return
      }

      const article = articles[rowIndex]
      const articleHash = articleHashes[rowIndex]
      if (!article || !articleHash) {
        return
      }

      const action = actionTarget.getAttribute('data-news-action')
      if (action === 'save') {
        event.preventDefault()
        void handleAddToDatabase(article, articleHash)
        return
      }

      if (action === 'comment' && savedArticleHashes.has(articleHash)) {
        event.preventDefault()
        setSelectedCommentArticle({
          articleHash,
          articleTitle: article.title || articleHash,
          startComposerOpen: true,
        })
      }
    }

    tableElement.addEventListener('click', handleTableClick)

    return () => {
      tableElement.removeEventListener('click', handleTableClick)
    }
  }, [articleHashes, articles, handleAddToDatabase, savedArticleHashes])

  const rows = useMemo(
    () =>
      articles.map((article, index) => {
        const articleHash = articleHashes[index]
        const isSaved = articleHash ? savedArticleHashes.has(articleHash) : false
        const isSaving = articleHash ? savingArticleHashes.has(articleHash) : false
        const articleComments = articleHash ? commentsByArticleHash[articleHash] || [] : []
        const previewComments = articleComments.slice(0, 2)

        return (
          <tr key={article.article_id || `${article.title}-${index}`}>
            <td>
              <a
                href={article.link}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  openNewsPopup(article.link)
                }}
              >
                {article.title}
              </a>
              <div className="small text-gray-500">{article.snippet}</div>
              {isSaved ? (
                <div className="mt-2 pt-2 border-top">
                  <div className="small text-success font-weight-bold d-flex align-items-center gap-2">
                    {articleComments.length ? (
                      <span>{`${articleComments.length} comment${articleComments.length === 1 ? '' : 's'}`}</span>
                    ) : articleHash ? (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-success font-weight-bold"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          setSelectedCommentArticle({
                            articleHash,
                            articleTitle: article.title || articleHash,
                            startComposerOpen: true,
                          })
                        }}
                      >
                        No comments yet — Add first comment
                      </button>
                    ) : (
                      <span>No comments yet</span>
                    )}
                    {articleComments.length > 0 && articleHash ? (
                      <a href={buildArticlePath(articleHash)} className="small font-weight-normal text-primary ml-2">
                        View Article →
                      </a>
                    ) : null}
                  </div>
                  {previewComments.length ? (
                    <div className="mt-1">
                      {previewComments.map((comment) => (
                        <div className="small text-gray-700 mb-1 d-flex justify-content-between align-items-start" key={comment.id}>
                          <div className="pr-2">
                            <span className="font-weight-bold">{comment.user?.display_name || 'Guest Commenter'}:</span>{' '}
                            {comment.body}
                          </div>
                          {comment.id ? (
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0"
                              onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                setSelectedCommentArticle({
                                  articleHash,
                                  articleTitle: article.title || articleHash,
                                  startComposerOpen: false,
                                  replyCommentId: comment.id,
                                })
                              }}
                            >
                              Reply
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="small text-gray-500 mt-1">Comments will show here after they are posted.</div>
                  )}
                </div>
              ) : null}
            </td>
            <td>{article.source_name || 'Unknown source'}</td>
            <td>{formatPublishedDate(article.published_datetime_utc)}</td>
            <td>{article.authors?.length ? article.authors.join(', ') : '—'}</td>
            <td className="text-nowrap text-center">
              {mysqlEnabled && articleHash && !isSaved ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  data-news-action="save"
                  data-row-index={index}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : 'Add to Database'}
                </button>
              ) : isSaved && articleHash && articleComments.length > 0 ? (
                <a href={buildArticlePath(articleHash)} className="btn btn-sm btn-outline-success">
                  View Article
                </a>
              ) : statusLoading ? (
                <span className="small text-gray-500">Checking…</span>
              ) : (
                <span className="small text-gray-500">Unavailable</span>
              )}
            </td>
          </tr>
        )
      }),
    [articleHashes, articles, commentsByArticleHash, handleAddToDatabase, mysqlEnabled, savedArticleHashes, savingArticleHashes, statusLoading],
  )

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h6 className="m-0 font-weight-bold text-primary">{title}</h6>
          <div className="small text-gray-500">{subtitle}</div>
        </div>
        <div className="small text-gray-500 text-right">
          <div>{loading ? 'Loading news…' : `${articles.length} articles`}</div>
          <div>{mysqlEnabled ? 'MySQL sync enabled' : 'MySQL sync disabled'}</div>
        </div>
      </div>

      {saveError ? (
        <div className="alert alert-warning" role="alert">
          {saveError}
        </div>
      ) : null}

      {error ? (
        <div className="alert alert-warning mb-0" role="alert">
          {error}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered" id={tableId} width="100%" cellSpacing="0" ref={tableRef}>
            <thead>
              <tr>
                {DEFAULT_COLUMNS.map((column) => (
                  <th key={column}>{column}</th>
                ))}
                <th>Database</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center text-gray-500">
                    {loadingLabel}
                  </td>
                </tr>
              ) : rows.length ? (
                rows
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-gray-500">
                    {emptyLabel}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedCommentArticle ? (
        <ArticleCommentsPanel
          articleHash={selectedCommentArticle.articleHash}
          articleTitle={selectedCommentArticle.articleTitle}
          startComposerOpen={selectedCommentArticle.startComposerOpen}
          initialReplyCommentId={selectedCommentArticle.replyCommentId ?? null}
          onCommentCreated={(createdComment) => handleCommentCreated(selectedCommentArticle.articleHash, createdComment)}
          onClose={() => setSelectedCommentArticle(null)}
        />
      ) : null}
    </div>
  )
}

export default NewsDataTable

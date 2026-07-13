import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildNewsApiUrl } from '../utils/newsApi'

function normalizeArticles(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  return payload?.data?.top_news?.all_articles ?? payload?.data?.all_articles ?? []
}

function buildNewsRequestUrl(endpointPath, queryParams = {}) {
  const searchParams = new URLSearchParams({ endpointPath })

  Object.entries(queryParams).forEach(([key, value]) => {
    searchParams.append(key, String(value))
  })

  return buildNewsApiUrl(`/api/news?${searchParams.toString()}`)
}

function getSavedArticleHashes(articleHashes, savedArticleHashes) {
  return articleHashes.filter((articleHash) => articleHash && savedArticleHashes.has(articleHash))
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

function useNewsCardGridData({ endpointPath, queryParams, loadErrorLabel }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mysqlEnabled, setMysqlEnabled] = useState(false)
  const [articleHashes, setArticleHashes] = useState([])
  const [savedArticleHashes, setSavedArticleHashes] = useState(() => new Set())
  const [savingArticleHashes, setSavingArticleHashes] = useState(() => new Set())
  const [saveError, setSaveError] = useState('')
  const [selectedCommentArticle, setSelectedCommentArticle] = useState(null)
  const [commentsByArticleHash, setCommentsByArticleHash] = useState({})

  const requestUrl = useMemo(() => buildNewsRequestUrl(endpointPath, queryParams), [endpointPath, queryParams])

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
        setArticles(randomizeArticles(normalizeArticles(payload)))
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || loadErrorLabel)
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
  }, [loadErrorLabel, requestUrl])

  useEffect(() => {
    const abortController = new AbortController()

    async function loadMysqlStatuses() {
      if (loading || error || !articles.length) {
        return
      }

      try {
        const response = await fetch(buildNewsApiUrl('/api/mysql/articles/status'), {
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
  }, [articleHashes, mysqlEnabled, savedArticleHashes])

  const handleAddToDatabase = useCallback(async (article, articleHash) => {
    if (!articleHash || savingArticleHashes.has(articleHash)) {
      return
    }

    setSaveError('')
    setSavingArticleHashes((previousState) => new Set(previousState).add(articleHash))

    try {
      const response = await fetch(buildNewsApiUrl('/api/mysql/articles'), {
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

  return {
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
  }
}

export default useNewsCardGridData

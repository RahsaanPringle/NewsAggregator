import { useEffect, useMemo, useRef, useState } from 'react'

const RAPID_API_HOST = 'real-time-news-data.p.rapidapi.com'
const DEFAULT_COLUMNS = ['Headline', 'Source', 'Published', 'Authors']

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

function buildQueryString(queryParams = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  return searchParams.toString()
}

function normalizeArticles(payload) {
  return payload?.data?.top_news?.all_articles ?? payload?.data?.all_articles ?? []
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

  const apiKey = import.meta.env.VITE_RAPIDAPI_KEY
  const requestUrl = useMemo(() => {
    const queryString = buildQueryString(queryParams)
    return `https://real-time-news-data.p.rapidapi.com${endpointPath}${queryString ? `?${queryString}` : ''}`
  }, [endpointPath, queryParams])

  useEffect(() => {
    const abortController = new AbortController()

    async function loadNews() {
      if (!apiKey) {
        setError('Missing RapidAPI key. Set VITE_RAPIDAPI_KEY in sb-admin-react/.env.local.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': RAPID_API_HOST,
            'x-rapidapi-key': apiKey,
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
  }, [apiKey, errorLabel, requestUrl])

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

  const rows = useMemo(
    () =>
      articles.map((article, index) => (
        <tr key={article.article_id || `${article.title}-${index}`}>
          <td>
            <a href={article.link} target="_blank" rel="noreferrer">
              {article.title}
            </a>
            <div className="small text-gray-500">{article.snippet}</div>
          </td>
          <td>{article.source_name || 'Unknown source'}</td>
          <td>{formatPublishedDate(article.published_datetime_utc)}</td>
          <td>{article.authors?.length ? article.authors.join(', ') : '—'}</td>
        </tr>
      )),
    [articles],
  )

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h6 className="m-0 font-weight-bold text-primary">{title}</h6>
          <div className="small text-gray-500">{subtitle}</div>
        </div>
        <div className="small text-gray-500">{loading ? 'Loading news…' : `${articles.length} articles`}</div>
      </div>

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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center text-gray-500">
                    {loadingLabel}
                  </td>
                </tr>
              ) : rows.length ? (
                rows
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-gray-500">
                    {emptyLabel}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default NewsDataTable

import { useEffect, useMemo, useRef, useState } from 'react'
import { buildNewsApiUrl } from '../utils/newsApi'
import DashboardCardMenu from './DashboardCardMenu'

const SOURCE_COLORS = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b']
const SOURCE_HOVER_COLORS = ['#2e59d9', '#17a673', '#2c9faf', '#dda20a', '#be2617']
const NEWS_SOURCE_LIMIT = 4

function buildSourceDistributionUrl() {
  const searchParams = new URLSearchParams({ limit: String(NEWS_SOURCE_LIMIT) })
  return buildNewsApiUrl(`/api/mysql/articles/source-distribution?${searchParams.toString()}`)
}

function normalizeSourceDistributionPayload(payload) {
  const normalizedItems = Array.isArray(payload?.items)
    ? payload.items
        .map((item) => ({
          sourceName: String(item?.sourceName || 'Unknown source').trim() || 'Unknown source',
          count: Number(item?.count || 0),
        }))
        .filter((item) => item.count > 0)
    : []

  return {
    enabled: Boolean(payload?.enabled),
    totalArticles: Number(payload?.totalArticles || 0),
    items: normalizedItems,
    message: payload?.message || '',
    error: payload?.error || '',
  }
}

function DashboardRowTwoNewsSourceDistribution({ scriptsReady }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)
  const [sourceItems, setSourceItems] = useState([])
  const [totalArticles, setTotalArticles] = useState(0)
  const [mysqlEnabled, setMysqlEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const abortController = new AbortController()

    async function loadArticles() {
      setLoading(true)
      setError('')
      setMysqlEnabled(true)

      try {
        const response = await fetch(buildSourceDistributionUrl(), {
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
        const normalizedPayload = normalizeSourceDistributionPayload(payload)

        setSourceItems(normalizedPayload.items)
        setTotalArticles(normalizedPayload.totalArticles)
        setMysqlEnabled(normalizedPayload.enabled)

        if (!normalizedPayload.enabled && normalizedPayload.message) {
          setError(normalizedPayload.message)
        }

        if (normalizedPayload.error) {
          setError(normalizedPayload.error)
        }
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load source distribution.')
          setSourceItems([])
          setTotalArticles(0)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadArticles()

    return () => {
      abortController.abort()
    }
  }, [])

  const sourceData = useMemo(() => {
    return {
      labels: sourceItems.map((item) => item.sourceName),
      values: sourceItems.map((item) => item.count),
    }
  }, [sourceItems])

  useEffect(() => {
    const chartApi = window.Chart
    const canvas = canvasRef.current

    if (!scriptsReady || !chartApi || !canvas || loading || error || sourceData.values.length === 0) {
      return undefined
    }

    if (chartRef.current && typeof chartRef.current.destroy === 'function') {
      chartRef.current.destroy()
    }

    const context = canvas.getContext('2d')

    chartRef.current = new chartApi(context, {
      type: 'doughnut',
      data: {
        labels: sourceData.labels,
        datasets: [
          {
            data: sourceData.values,
            backgroundColor: SOURCE_COLORS.slice(0, sourceData.values.length),
            hoverBackgroundColor: SOURCE_HOVER_COLORS.slice(0, sourceData.values.length),
            hoverBorderColor: 'rgba(234, 236, 244, 1)',
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        tooltips: {
          backgroundColor: 'rgb(255,255,255)',
          bodyFontColor: '#858796',
          borderColor: '#dddfeb',
          borderWidth: 1,
          xPadding: 15,
          yPadding: 15,
          displayColors: false,
          caretPadding: 10,
          callbacks: {
            label: (tooltipItem, data) => {
              const label = data.labels?.[tooltipItem.index] || 'Source'
              const value = data.datasets?.[0]?.data?.[tooltipItem.index] || 0
              return `${label}: ${value} articles`
            },
          },
        },
        legend: {
          display: false,
        },
        cutoutPercentage: 75,
      },
    })

    return () => {
      if (chartRef.current && typeof chartRef.current.destroy === 'function') {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [error, loading, scriptsReady, sourceData.labels, sourceData.values])

  return (
    <div className="col-xl-4 col-lg-5">
      <div className="card shadow mb-4">
        <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
          <h6 className="m-0 font-weight-bold text-primary">News Source Distribution</h6>
          <DashboardCardMenu menuId="newsSourceDistributionMenu" />
        </div>
        <div className="card-body">
          <div className="small text-gray-500 mb-3">Top article sources from MySQL</div>
          {error ? (
            <div className="alert alert-warning mb-0" role="alert">
              {error}
            </div>
          ) : (
            <>
              <div className="chart-pie pt-2 pb-2">
                <canvas ref={canvasRef}></canvas>
              </div>
              <div className="mt-4 text-center small">
                {loading
                  ? 'Loading source share...'
                  : sourceData.labels.length > 0
                    ? sourceData.labels.map((label, index) => (
                      <span key={label} className="mr-2">
                        <i className="fas fa-circle" style={{ color: SOURCE_COLORS[index] }}></i> {label}
                      </span>
                    ))
                    : mysqlEnabled
                      ? 'No article sources found in the database'
                      : 'MySQL not configured'}
              </div>
              {!loading && sourceData.labels.length > 0 ? (
                <div className="mt-3 small text-gray-600 text-center">
                  {new Intl.NumberFormat('en-US').format(totalArticles)} database articles counted
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardRowTwoNewsSourceDistribution

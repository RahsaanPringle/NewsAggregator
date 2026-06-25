import { useEffect, useMemo, useRef, useState } from 'react'
import DashboardCardMenu from './DashboardCardMenu'

const SOURCE_COLORS = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b']
const SOURCE_HOVER_COLORS = ['#2e59d9', '#17a673', '#2c9faf', '#dda20a', '#be2617']

function buildNewsApiUrl() {
  const searchParams = new URLSearchParams({ endpointPath: '/topic-headlines' })
  searchParams.append('topic', 'WORLD')
  searchParams.append('limit', '500')
  searchParams.append('country', 'US')
  searchParams.append('lang', 'en')

  return `/api/news?${searchParams.toString()}`
}

function normalizeArticles(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  return payload?.data?.top_news?.all_articles ?? payload?.data?.all_articles ?? []
}

function DashboardRowTwoNewsSourceDistribution({ scriptsReady }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const abortController = new AbortController()

    async function loadArticles() {
      setLoading(true)
      setError('')

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
        setArticles(normalizeArticles(payload))
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load source distribution.')
          setArticles([])
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
    const counts = new Map()

    articles.forEach((article) => {
      const sourceName = String(article?.source_name || 'Unknown source').trim() || 'Unknown source'
      counts.set(sourceName, (counts.get(sourceName) || 0) + 1)
    })

    const sorted = [...counts.entries()].sort((left, right) => right[1] - left[1])
    const topSources = sorted.slice(0, 4)
    const remainderCount = sorted.slice(4).reduce((sum, entry) => sum + entry[1], 0)

    if (remainderCount > 0) {
      topSources.push(['Other', remainderCount])
    }

    return {
      labels: topSources.map((entry) => entry[0]),
      values: topSources.map((entry) => entry[1]),
    }
  }, [articles])

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
          <div className="small text-gray-500 mb-3">Top sources from the same cached world headlines JSON feed</div>
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
                  : sourceData.labels.map((label, index) => (
                      <span key={label} className="mr-2">
                        <i className="fas fa-circle" style={{ color: SOURCE_COLORS[index] }}></i> {label}
                      </span>
                    ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardRowTwoNewsSourceDistribution

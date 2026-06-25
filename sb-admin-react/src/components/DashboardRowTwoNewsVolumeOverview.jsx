import { useEffect, useMemo, useRef, useState } from 'react'
import DashboardCardMenu from './DashboardCardMenu'

const NEWS_CHART_DAYS = 7

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

function buildRecentDayKeys(days) {
  const now = new Date()
  const keys = []

  for (let index = days - 1; index >= 0; index -= 1) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - index))
    keys.push(day.toISOString().slice(0, 10))
  }

  return keys
}

function formatDayLabel(isoDateString) {
  const value = new Date(`${isoDateString}T00:00:00Z`)
  if (Number.isNaN(value.getTime())) {
    return isoDateString
  }

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(value)
}

function DashboardRowTwoNewsVolumeOverview({ scriptsReady }) {
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
          setError(requestError.message || 'Unable to load chart data.')
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

  const chartData = useMemo(() => {
    const dayKeys = buildRecentDayKeys(NEWS_CHART_DAYS)
    const countsByDay = new Map(dayKeys.map((key) => [key, 0]))

    articles.forEach((article) => {
      if (!article?.published_datetime_utc) {
        return
      }

      const publishedDate = new Date(article.published_datetime_utc)
      if (Number.isNaN(publishedDate.getTime())) {
        return
      }

      const dayKey = publishedDate.toISOString().slice(0, 10)
      if (!countsByDay.has(dayKey)) {
        return
      }

      countsByDay.set(dayKey, (countsByDay.get(dayKey) || 0) + 1)
    })

    return {
      labels: dayKeys.map((key) => formatDayLabel(key)),
      values: dayKeys.map((key) => countsByDay.get(key) || 0),
    }
  }, [articles])

  useEffect(() => {
    const chartApi = window.Chart
    const canvas = canvasRef.current

    if (!scriptsReady || !chartApi || !canvas || loading || error) {
      return undefined
    }

    if (chartRef.current && typeof chartRef.current.destroy === 'function') {
      chartRef.current.destroy()
    }

    const context = canvas.getContext('2d')

    chartRef.current = new chartApi(context, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Articles',
            lineTension: 0.3,
            backgroundColor: 'rgba(78, 115, 223, 0.05)',
            borderColor: 'rgba(78, 115, 223, 1)',
            pointRadius: 3,
            pointBackgroundColor: 'rgba(78, 115, 223, 1)',
            pointBorderColor: 'rgba(78, 115, 223, 1)',
            pointHoverRadius: 3,
            pointHoverBackgroundColor: 'rgba(78, 115, 223, 1)',
            pointHoverBorderColor: 'rgba(78, 115, 223, 1)',
            pointHitRadius: 10,
            pointBorderWidth: 2,
            data: chartData.values,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 10,
            right: 25,
            top: 25,
            bottom: 0,
          },
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                display: false,
                drawBorder: false,
              },
              ticks: {
                maxTicksLimit: 7,
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                maxTicksLimit: 5,
                padding: 10,
                callback: (value) => new Intl.NumberFormat('en-US').format(value),
              },
              gridLines: {
                color: 'rgb(234, 236, 244)',
                zeroLineColor: 'rgb(234, 236, 244)',
                drawBorder: false,
                borderDash: [2],
                zeroLineBorderDash: [2],
              },
            },
          ],
        },
        legend: {
          display: false,
        },
        tooltips: {
          backgroundColor: 'rgb(255,255,255)',
          bodyFontColor: '#858796',
          titleMarginBottom: 10,
          titleFontColor: '#6e707e',
          titleFontSize: 14,
          borderColor: '#dddfeb',
          borderWidth: 1,
          xPadding: 15,
          yPadding: 15,
          displayColors: false,
          intersect: false,
          mode: 'index',
          caretPadding: 10,
          callbacks: {
            label: (tooltipItem) => `Articles: ${new Intl.NumberFormat('en-US').format(tooltipItem.yLabel || 0)}`,
          },
        },
      },
    })

    return () => {
      if (chartRef.current && typeof chartRef.current.destroy === 'function') {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [chartData.labels, chartData.values, error, loading, scriptsReady])

  const totalArticles = articles.length

  return (
    <div className="col-xl-8 col-lg-7">
      <div className="card shadow mb-4">
        <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
          <h6 className="m-0 font-weight-bold text-primary">News Volume Overview</h6>
          <DashboardCardMenu menuId="newsVolumeDropdownMenu" />
        </div>
        <div className="card-body">
          <div className="small text-gray-500 mb-3">Daily article count from cached API JSON (last 7 days)</div>
          {error ? (
            <div className="alert alert-warning mb-0" role="alert">
              {error}
            </div>
          ) : (
            <>
              <div className="chart-area">
                <canvas ref={canvasRef}></canvas>
              </div>
              <div className="mt-3 small text-gray-600">
                {loading ? 'Loading chart data...' : `${totalArticles} articles in source feed`}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardRowTwoNewsVolumeOverview

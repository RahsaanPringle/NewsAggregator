import { useEffect, useMemo, useRef, useState } from 'react'
import DashboardCardMenu from './DashboardCardMenu'

const NEWS_CHART_DAYS = 7

function buildSavedByDayUrl() {
  const searchParams = new URLSearchParams({ days: String(NEWS_CHART_DAYS) })
  return `/api/mysql/articles/saved-by-day?${searchParams.toString()}`
}

function normalizeSavedByDayPayload(payload) {
  const normalizedItems = Array.isArray(payload?.items)
    ? payload.items
        .map((item) => ({
          date: typeof item?.date === 'string' ? item.date : '',
          count: Number(item?.count || 0),
        }))
        .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.date))
    : []

  return {
    enabled: Boolean(payload?.enabled),
    totalSaved: Number(payload?.totalSaved || 0),
    items: normalizedItems,
    message: payload?.message || '',
    error: payload?.error || '',
  }
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
  const [savedByDay, setSavedByDay] = useState([])
  const [totalSaved, setTotalSaved] = useState(0)
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
        const response = await fetch(buildSavedByDayUrl(), {
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
        const normalizedPayload = normalizeSavedByDayPayload(payload)

        setSavedByDay(normalizedPayload.items)
        setTotalSaved(normalizedPayload.totalSaved)
        setMysqlEnabled(normalizedPayload.enabled)

        if (!normalizedPayload.enabled && normalizedPayload.message) {
          setError(normalizedPayload.message)
        }

        if (normalizedPayload.error) {
          setError(normalizedPayload.error)
        }
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load chart data.')
          setSavedByDay([])
          setTotalSaved(0)
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

    savedByDay.forEach((item) => {
      if (!item?.date || !countsByDay.has(item.date)) {
        return
      }

      countsByDay.set(item.date, Number(item.count || 0))
    })

    return {
      labels: dayKeys.map((key) => formatDayLabel(key)),
      values: dayKeys.map((key) => countsByDay.get(key) || 0),
    }
  }, [savedByDay])

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

  return (
    <div className="col-xl-8 col-lg-7">
      <div className="card shadow mb-4">
        <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
          <h6 className="m-0 font-weight-bold text-primary">News Volume Overview</h6>
          <DashboardCardMenu menuId="newsVolumeDropdownMenu" />
        </div>
        <div className="card-body">
          <div className="small text-gray-500 mb-3">Daily article count by save date in MySQL (last 7 days)</div>
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
                {loading
                  ? 'Loading chart data...'
                  : mysqlEnabled
                    ? `${new Intl.NumberFormat('en-US').format(totalSaved)} articles saved in the last 7 days`
                    : 'MySQL not configured'}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardRowTwoNewsVolumeOverview

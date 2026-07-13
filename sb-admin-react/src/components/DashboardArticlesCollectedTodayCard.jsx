import { useEffect, useState } from 'react'
import { buildNewsApiUrl } from '../utils/newsApi'
import DashboardStatCard from './DashboardStatCard'

function formatCount(value) {
  return new Intl.NumberFormat('en-US').format(value)
}

function DashboardArticlesCollectedTodayCard() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const abortController = new AbortController()

    async function loadCollectedTodayCount() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(buildNewsApiUrl('/api/mysql/articles/collected-today'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Metric request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setCount(Number(payload.count || 0))

        if (payload.enabled === false && payload.message) {
          setError(payload.message)
        }
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || "Unable to load today's article count.")
          setCount(0)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadCollectedTodayCount()

    return () => {
      abortController.abort()
    }
  }, [])

  return (
    <DashboardStatCard
      jsx="DashboardArticlesCollectedTodayCard"
      componentClass="dashboard-articles-collected-today-card"
      borderClass="border-left-primary"
      titleClass="text-primary"
      title="Articles Collected Today"
      value={loading ? 'Loading...' : formatCount(count)}
      iconClass="fas fa-newspaper"
      helpText={error}
    />
  )
}

export default DashboardArticlesCollectedTodayCard

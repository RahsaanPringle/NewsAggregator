import { useEffect, useState } from 'react'
import { buildNewsApiUrl } from '../utils/newsApi'
import DashboardStatCard from './DashboardStatCard'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function DashboardCommentRevenueCard() {
  const [revenue, setRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const abortController = new AbortController()

    async function loadCommentRevenue() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(buildNewsApiUrl('/api/mysql/comments/revenue'), {
          method: 'GET',
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Revenue request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setRevenue(Number(payload.revenue || 0))

        if (payload.enabled === false && (payload.message || payload.error)) {
          setError(payload.message || payload.error)
        }
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load comment revenue.')
          setRevenue(0)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadCommentRevenue()

    return () => {
      abortController.abort()
    }
  }, [])

  return (
    <DashboardStatCard
      jsx="DashboardCommentRevenueCard"
      componentClass="dashboard-comment-revenue-card"
      borderClass="border-left-success"
      titleClass="text-success"
      title="Comment Revenue"
      value={loading ? 'Loading...' : formatCurrency(revenue)}
      iconClass="fas fa-dollar-sign"
      helpText={error}
    />
  )
}

export default DashboardCommentRevenueCard

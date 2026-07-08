import { useEffect, useState } from 'react'
import DashboardStatCard from './DashboardStatCard'

function formatCount(value) {
  return new Intl.NumberFormat('en-US').format(value)
}

function DashboardCommentsWithoutResponsesCard() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const abortController = new AbortController()

    async function loadCommentsWithoutResponses() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/mysql/comments/without-responses', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Unanswered comments request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setCount(Number(payload.count || 0))

        if (payload.enabled === false && (payload.message || payload.error)) {
          setError(payload.message || payload.error)
        }
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load comments without responses.')
          setCount(0)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadCommentsWithoutResponses()

    return () => {
      abortController.abort()
    }
  }, [])

  return (
    <DashboardStatCard
      jsx="DashboardCommentsWithoutResponsesCard"
      componentClass="dashboard-comments-without-responses-card"
      borderClass="border-left-warning"
      titleClass="text-warning"
      title="Comments without Responses"
      value={loading ? 'Loading...' : formatCount(count)}
      iconClass="fas fa-comment-slash"
      helpText={error}
    />
  )
}

export default DashboardCommentsWithoutResponsesCard

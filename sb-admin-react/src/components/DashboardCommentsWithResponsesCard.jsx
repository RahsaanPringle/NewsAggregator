import { useEffect, useState } from 'react'
import { buildNewsApiUrl } from '../utils/newsApi'
import DashboardStatCard from './DashboardStatCard'

function formatCount(value) {
  return new Intl.NumberFormat('en-US').format(value)
}

function DashboardCommentsWithResponsesCard() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const abortController = new AbortController()

    async function loadCommentsWithResponses() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(buildNewsApiUrl('/api/mysql/comments/with-responses'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Response metric request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setCount(Number(payload.count || 0))

        if (payload.enabled === false && (payload.message || payload.error)) {
          setError(payload.message || payload.error)
        }
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load comments with responses.')
          setCount(0)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadCommentsWithResponses()

    return () => {
      abortController.abort()
    }
  }, [])

  return (
    <DashboardStatCard
      jsx="DashboardCommentsWithResponsesCard"
      componentClass="dashboard-comments-with-responses-card"
      borderClass="border-left-info"
      titleClass="text-info"
      title="Comments with Responses"
      value={loading ? 'Loading...' : formatCount(count)}
      iconClass="fas fa-reply"
      helpText={error}
    />
  )
}

export default DashboardCommentsWithResponsesCard

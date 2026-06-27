import { useEffect, useState } from 'react'

const MYSQL_API_BASE_URL = String(import.meta.env.VITE_NEWS_API_BASE_URL || '').trim().replace(/\/+$/, '')

function buildMysqlApiUrl(routePath) {
  return MYSQL_API_BASE_URL ? `${MYSQL_API_BASE_URL}${routePath}` : routePath
}

function formatTimestamp(value) {
  if (!value) {
    return 'Just now'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        resolve(null)
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 5000,
      },
    )
  })
}

function ArticleCommentsPanel({ articleHash, articleTitle, onClose, startComposerOpen = false, onCommentCreated }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showComposer, setShowComposer] = useState(startComposerOpen)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [consentIpAddress, setConsentIpAddress] = useState(true)
  const [consentLocation, setConsentLocation] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')

  useEffect(() => {
    const abortController = new AbortController()

    async function loadComments() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(buildMysqlApiUrl(`/api/articles/${articleHash}/comments`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Comment request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setComments(Array.isArray(payload.items) ? payload.items : [])
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load comments for this article.')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadComments()

    return () => {
      abortController.abort()
    }
  }, [articleHash])

  useEffect(() => {
    setShowComposer(startComposerOpen)
  }, [articleHash, startComposerOpen])

  async function handleSubmit(event) {
    event.preventDefault()

    const trimmedBody = body.trim()
    if (!trimmedBody || submitting) {
      return
    }

    setSubmitting(true)
    setSubmitError('')
    setLocationStatus('')

    try {
      let location = null
      if (consentLocation) {
        location = await getCurrentLocation()
        if (location) {
          setLocationStatus('Location captured for this comment.')
        } else {
          setLocationStatus('Location was unavailable, so the comment was posted with IP-only matching.')
        }
      }

      const response = await fetch(buildMysqlApiUrl(`/api/articles/${articleHash}/comments`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: trimmedBody,
          consent: {
            ipAddress: consentIpAddress,
            location: consentLocation,
          },
          location,
        }),
      })

      if (!response.ok) {
        throw new Error(`Comment save failed with status ${response.status}`)
      }

      const createdComment = await response.json()
      setComments((previousState) => [...previousState, createdComment])
      onCommentCreated?.(createdComment)
      setBody('')
      setShowComposer(false)
    } catch (requestError) {
      setSubmitError(requestError.message || 'Unable to save your comment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card shadow mt-4 border-left-success">
      <div className="card-header py-3 d-flex justify-content-between align-items-center">
        <div>
          <h6 className="m-0 font-weight-bold text-success">Comments</h6>
          <div className="small text-gray-500">{articleTitle || articleHash}</div>
        </div>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="small text-gray-500">
            {loading ? 'Loading comments…' : `${comments.length} comment${comments.length === 1 ? '' : 's'}`}
          </div>
          {!showComposer ? (
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={() => {
                setSubmitError('')
                setLocationStatus('')
                setShowComposer(true)
              }}
            >
              Add Comment
            </button>
          ) : null}
        </div>

        {showComposer ? (
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="form-group">
              <label htmlFor="article-comment-body" className="small text-gray-700 font-weight-bold">
                Add a comment
              </label>
              <textarea
                id="article-comment-body"
                className="form-control"
                rows="3"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write a quick note about the article..."
                disabled={submitting}
              />
            </div>

            <div className="form-check mb-2">
              <input
                id="comment-consent-ip"
                className="form-check-input"
                type="checkbox"
                checked={consentIpAddress}
                onChange={(event) => setConsentIpAddress(event.target.checked)}
                disabled={submitting}
              />
              <label className="form-check-label small" htmlFor="comment-consent-ip">
                Use my IP address as a return identifier for this profile.
              </label>
            </div>

            <div className="form-check mb-3">
              <input
                id="comment-consent-location"
                className="form-check-input"
                type="checkbox"
                checked={consentLocation}
                onChange={(event) => setConsentLocation(event.target.checked)}
                disabled={submitting}
              />
              <label className="form-check-label small" htmlFor="comment-consent-location">
                Try to include my current browser location too.
              </label>
            </div>

            {locationStatus ? <div className="small text-gray-500 mb-3">{locationStatus}</div> : null}
            {submitError ? (
              <div className="alert alert-warning" role="alert">
                {submitError}
              </div>
            ) : null}

            <div className="d-flex align-items-center">
              <button type="submit" className="btn btn-success btn-sm mr-2" disabled={submitting || !body.trim()}>
                {submitting ? 'Posting…' : 'Post Comment'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={submitting}
                onClick={() => {
                  setShowComposer(false)
                  setSubmitError('')
                  setLocationStatus('')
                  setBody('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {error ? (
          <div className="alert alert-warning mb-0" role="alert">
            {error}
          </div>
        ) : loading ? (
          <div className="small text-gray-500">Loading comments…</div>
        ) : comments.length ? (
          <div>
            {comments.map((comment) => (
              <article className="border rounded p-3 mb-3" key={comment.id}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center">
                    {comment.user?.profile_thumbnail_data_url ? (
                      <img
                        src={comment.user.profile_thumbnail_data_url}
                        alt={comment.user.display_name || 'Comment user'}
                        width="40"
                        height="40"
                        className="rounded-circle mr-3"
                      />
                    ) : null}
                    <div>
                      <div className="font-weight-bold text-gray-800">{comment.user?.display_name || 'Guest Commenter'}</div>
                      <div className="small text-gray-500">
                        {comment.user?.username ? `@${comment.user.username} · ` : ''}
                        {formatTimestamp(comment.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mb-0 text-gray-800">{comment.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="small text-gray-500 mb-0">No comments yet. Be the first one to add one.</div>
        )}
      </div>
    </div>
  )
}

export default ArticleCommentsPanel
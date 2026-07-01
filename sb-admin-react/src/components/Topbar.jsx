import { useEffect, useMemo, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import HtmlSection from './HtmlSection'
import UserDropdown from './UserDropdown'
import topbarHtml from '../markup/topbar.html?raw'
import { getCurrentCommentUserId } from '../utils/commentUserSession'

const MYSQL_API_BASE_URL = String(import.meta.env.VITE_NEWS_API_BASE_URL || '').trim().replace(/\/+$/, '')

function buildMysqlApiUrl(routePath) {
  return MYSQL_API_BASE_URL ? `${MYSQL_API_BASE_URL}${routePath}` : routePath
}

function formatRelativeTimestamp(value) {
  if (!value) {
    return 'Just now'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Just now'
  }

  const seconds = Math.max(1, Math.floor((Date.now() - parsedDate.getTime()) / 1000))
  if (seconds < 60) {
    return `${seconds}s ago`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildMessageItemsHtml({ loading, error, messages }) {
  if (loading) {
    return '<div class="dropdown-item small text-gray-500">Loading messages...</div>'
  }

  if (error) {
    return `<div class="dropdown-item small text-danger">${escapeHtml(error)}</div>`
  }

  if (!messages.length) {
    return '<div class="dropdown-item small text-gray-500">No messages yet.</div>'
  }

  return messages
    .map((message) => {
      const senderName = escapeHtml(message?.sender?.display_name || 'Commenter')
      const avatar = escapeHtml(message?.sender?.profile_thumbnail_data_url || 'img/undraw_profile.svg')
      const excerpt = escapeHtml(message?.reply_comment_excerpt || 'replied to your comment.')
      const articleTitle = escapeHtml(message?.article?.title || 'an article')
      const timestamp = escapeHtml(formatRelativeTimestamp(message?.created_at))

      return `<a class="dropdown-item d-flex align-items-center" href="#" data-message-id="${escapeHtml(message?.id)}">
        <div class="dropdown-list-image mr-3">
          <img class="rounded-circle" src="${avatar}" alt="${senderName}">
          <div class="status-indicator bg-success"></div>
        </div>
        <div>
          <div class="text-truncate"><strong>${senderName}</strong>: ${excerpt}</div>
          <div class="small text-gray-500">${articleTitle} &middot; ${timestamp}</div>
        </div>
      </a>`
    })
    .join('')
}

function Topbar() {
  const [currentCommentUserId, setCurrentCommentUserId] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function syncCurrentCommentUser() {
      setCurrentCommentUserId(getCurrentCommentUserId())
    }

    syncCurrentCommentUser()
    window.addEventListener('storage', syncCurrentCommentUser)
    window.addEventListener('comment-user-updated', syncCurrentCommentUser)

    return () => {
      window.removeEventListener('storage', syncCurrentCommentUser)
      window.removeEventListener('comment-user-updated', syncCurrentCommentUser)
    }
  }, [])

  useEffect(() => {
    if (!currentCommentUserId) {
      setCurrentUser(null)
      return
    }

    const abortController = new AbortController()

    async function loadCurrentUser() {
      try {
        const response = await fetch(buildMysqlApiUrl(`/api/comment-users/${currentCommentUserId}`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Current user request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setCurrentUser(payload)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setCurrentUser(null)
        }
      }
    }

    void loadCurrentUser()

    return () => {
      abortController.abort()
    }
  }, [currentCommentUserId])

  useEffect(() => {
    if (!currentCommentUserId) {
      setMessages([])
      setLoading(false)
      setError('')
      return
    }

    const abortController = new AbortController()

    async function loadInboxMessages() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(
          buildMysqlApiUrl(`/api/comment-messages/inbox?commentUserId=${currentCommentUserId}&limit=4`),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: abortController.signal,
          },
        )

        if (!response.ok) {
          throw new Error(`Message inbox request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setMessages(Array.isArray(payload.items) ? payload.items : [])
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setMessages([])
          setError(requestError.message || 'Unable to load messages right now.')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadInboxMessages()

    return () => {
      abortController.abort()
    }
  }, [currentCommentUserId])

  const hasMessages = messages.length > 0
  const badgeLabel = messages.length > 99 ? '99+' : String(messages.length)
  const messageItemsHtml = buildMessageItemsHtml({ loading, error, messages })
  const userDropdownHtml = renderToStaticMarkup(<UserDropdown user={currentUser} />)

  const renderedTopbarHtml = useMemo(
    () =>
      topbarHtml
        .replace('__MESSAGE_TOGGLE_DATA__', hasMessages ? 'data-toggle="dropdown"' : '')
        .replace('__MESSAGE_TOGGLE_CLASS__', hasMessages ? '' : 'disabled')
        .replace('__MESSAGE_TOGGLE_ARIA_DISABLED__', hasMessages ? '' : 'aria-disabled="true"')
        .replace('__MESSAGE_BADGE_CLASS__', hasMessages ? '' : 'd-none')
        .replace('__MESSAGE_BADGE__', hasMessages ? badgeLabel : '0')
        .replace('__MESSAGE_ITEMS__', messageItemsHtml)
        .replace('__MESSAGE_FOOTER_CLASS__', hasMessages ? '' : 'disabled')
        .replace('__MESSAGE_FOOTER_TEXT__', hasMessages ? 'Read More Messages' : 'No Messages')
        .replace('__USER_DROPDOWN__', userDropdownHtml),
      [badgeLabel, currentUser, hasMessages, messageItemsHtml, userDropdownHtml],
  )

  return <HtmlSection html={renderedTopbarHtml} />
}

export default Topbar

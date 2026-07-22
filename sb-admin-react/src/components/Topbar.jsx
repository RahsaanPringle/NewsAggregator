import { useEffect, useMemo, useState } from 'react'
import HtmlSection from './HtmlSection'
import topbarHtml from '../markup/topbar.html?raw'
import {
  getCurrentCommentUserId,
  getCurrentCommentUserSnapshot,
  setCurrentCommentUser,
} from '../utils/commentUserSession'
import { buildNewsApiUrl, NEWS_API_BASE_URL } from '../utils/newsApi'
const NEWS_API_BASE_URL_STORAGE_KEY = 'news-api-base-url'

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

function buildUserDropdownHtml(user) {
  const displayName = escapeHtml(user?.display_name || 'Guest User')
  const avatarUrl = escapeHtml(user?.profile_thumbnail_data_url || '/img/undraw_profile.svg')

  return `<li class="nav-item dropdown no-arrow">
    <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      <span class="mr-2 d-none d-lg-inline text-gray-600 small">${displayName}</span>
      <img class="img-profile rounded-circle" src="${avatarUrl}" alt="${displayName}">
    </a>
    <div class="dropdown-menu dropdown-menu-right shadow animated--grow-in" aria-labelledby="userDropdown">
      <a class="dropdown-item" href="/profile.html"><i class="fas fa-user fa-sm fa-fw mr-2 text-gray-400"></i>Profile</a>
      <a class="dropdown-item" href="#"><i class="fas fa-cogs fa-sm fa-fw mr-2 text-gray-400"></i>Settings</a>
      <a class="dropdown-item" href="#"><i class="fas fa-list fa-sm fa-fw mr-2 text-gray-400"></i>Activity Log</a>
      <div class="dropdown-divider"></div>
      <a class="dropdown-item" href="#" data-toggle="modal" data-target="#logoutModal"><i class="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i>Logout</a>
    </div>
  </li>`
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
  const [currentUser, setCurrentUser] = useState(() => getCurrentCommentUserSnapshot())
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inboxRefreshNonce, setInboxRefreshNonce] = useState(0)

  useEffect(() => {
    if (NEWS_API_BASE_URL && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(NEWS_API_BASE_URL_STORAGE_KEY, NEWS_API_BASE_URL)
    }
  }, [])

  useEffect(() => {
    function syncCurrentCommentUser(event) {
      setCurrentCommentUserId(getCurrentCommentUserId())
      if (event?.detail?.user && typeof event.detail.user === 'object') {
        setCurrentUser(event.detail.user)
        return
      }

      setCurrentUser(getCurrentCommentUserSnapshot())
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
    if (currentCommentUserId) {
      return
    }

    const abortController = new AbortController()

    async function createRandomCommentUser() {
      try {
        const response = await fetch(buildNewsApiUrl('/api/comment-users/random'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Random comment user request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setCurrentCommentUser(payload)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setCurrentUser(getCurrentCommentUserSnapshot())
        }
      }
    }

    void createRandomCommentUser()

    return () => {
      abortController.abort()
    }
  }, [currentCommentUserId])

  useEffect(() => {
    if (!currentCommentUserId) {
      setCurrentUser(getCurrentCommentUserSnapshot())
      return
    }

    const abortController = new AbortController()

    async function loadCurrentUser() {
      try {
        const response = await fetch(buildNewsApiUrl(`/api/comment-users/${currentCommentUserId}`), {
          method: 'GET',
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Current user request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setCurrentUser(payload)
        setCurrentCommentUser(payload)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setCurrentUser(getCurrentCommentUserSnapshot())
        }
      }
    }

    void loadCurrentUser()

    return () => {
      abortController.abort()
    }
  }, [currentCommentUserId])

  useEffect(() => {
    function handleInboxRefreshEvent(event) {
      const recipientId = Number(event?.detail?.recipientCommentUserId || 0)
      if (recipientId > 0 && currentCommentUserId && recipientId !== currentCommentUserId) {
        return
      }

      setInboxRefreshNonce((previousValue) => previousValue + 1)
    }

    function handleWindowFocus() {
      setInboxRefreshNonce((previousValue) => previousValue + 1)
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        setInboxRefreshNonce((previousValue) => previousValue + 1)
      }
    }

    window.addEventListener('comment-message-created', handleInboxRefreshEvent)
    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('comment-message-created', handleInboxRefreshEvent)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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
          buildNewsApiUrl(`/api/comment-messages/inbox?commentUserId=${currentCommentUserId}&limit=4`),
          {
            method: 'GET',
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
  }, [currentCommentUserId, inboxRefreshNonce])

  const hasMessages = messages.length > 0
  const badgeLabel = messages.length > 99 ? '99+' : String(messages.length)
  const messageItemsHtml = buildMessageItemsHtml({ loading, error, messages })
  const userDropdownHtml = buildUserDropdownHtml(currentUser)

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

const COMMENT_USER_ID_STORAGE_KEY = 'news-comment-user-id'
const COMMENT_USER_SNAPSHOT_STORAGE_KEY = 'news-comment-user-snapshot'

function normalizeCommentUserId(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function getCurrentCommentUserId() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  return normalizeCommentUserId(window.localStorage.getItem(COMMENT_USER_ID_STORAGE_KEY))
}

export function getCurrentCommentUserSnapshot() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  const serializedValue = window.localStorage.getItem(COMMENT_USER_SNAPSHOT_STORAGE_KEY)
  if (!serializedValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(serializedValue)
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : null
  } catch {
    return null
  }
}

export function setCurrentCommentUserSnapshot(user) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  if (!user || typeof user !== 'object') {
    return null
  }

  const normalizedId = normalizeCommentUserId(user.id)
  if (!normalizedId) {
    return null
  }

  const snapshot = {
    id: normalizedId,
    display_name: user.display_name || null,
    username: user.username || null,
    email_placeholder: user.email_placeholder || null,
    gender: user.gender || null,
    nat: user.nat || null,
    created_at: user.created_at || null,
    profile_thumbnail_data_url: user.profile_thumbnail_data_url || null,
  }

  window.localStorage.setItem(COMMENT_USER_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot))
  return snapshot
}

export function setCurrentCommentUserId(commentUserId) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  const normalizedId = normalizeCommentUserId(commentUserId)
  if (!normalizedId) {
    return null
  }

  window.localStorage.setItem(COMMENT_USER_ID_STORAGE_KEY, String(normalizedId))
  window.dispatchEvent(new CustomEvent('comment-user-updated', { detail: { commentUserId: normalizedId } }))
  return normalizedId
}

export function setCurrentCommentUser(user) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  if (!user || typeof user !== 'object') {
    return null
  }

  const normalizedId = normalizeCommentUserId(user.id)
  if (!normalizedId) {
    return null
  }

  const snapshot = setCurrentCommentUserSnapshot(user)
  window.localStorage.setItem(COMMENT_USER_ID_STORAGE_KEY, String(normalizedId))
  window.dispatchEvent(
    new CustomEvent('comment-user-updated', {
      detail: {
        commentUserId: normalizedId,
        user: snapshot,
      },
    }),
  )

  return normalizedId
}

const COMMENT_USER_ID_STORAGE_KEY = 'news-comment-user-id'

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

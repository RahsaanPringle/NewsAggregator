let newsPopupWindow = null

function buildPopupFeatures() {
  const width = 1200
  const height = 800
  const left = Math.max(0, Math.floor((window.screen.width - width) / 2))
  const top = Math.max(0, Math.floor((window.screen.height - height) / 2))

  return [
    'popup=yes',
    'toolbar=no',
    'menubar=no',
    'location=no',
    'status=no',
    'personalbar=no',
    'scrollbars=yes',
    'resizable=yes',
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
  ].join(',')
}

export function openNewsPopup(url) {
  if (!url) {
    return null
  }

  if (newsPopupWindow && !newsPopupWindow.closed) {
    try {
      newsPopupWindow.location.href = url
      newsPopupWindow.focus()
      return newsPopupWindow
    } catch {
      // If browser security or popup state blocks access, reopen below.
    }
  }

  const openedWindow = window.open(url, 'newsArticlePopup', buildPopupFeatures())

  if (openedWindow) {
    newsPopupWindow = openedWindow
    openedWindow.focus()
  }

  return openedWindow
}

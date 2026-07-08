export function buildArticlePath(articleHash) {
  return articleHash ? `/article/${encodeURIComponent(articleHash)}` : '#'
}

export function getArticleHashFromPath(pathname) {
  const match = String(pathname || '').match(/^\/article\/([^/]+)\/?$/)
  return match ? decodeURIComponent(match[1]) : ''
}

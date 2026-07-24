const appBasePath = String(import.meta.env.BASE_URL || '/').replace(/\/+$/, '')

export function buildArticlePath(articleHash) {
  return articleHash ? `${appBasePath}/article/${encodeURIComponent(articleHash)}` : '#'
}

export function getArticleHashFromPath(pathname) {
  const normalizedPathname = String(pathname || '')
  const appPathname =
    appBasePath && normalizedPathname.startsWith(`${appBasePath}/`)
      ? normalizedPathname.slice(appBasePath.length)
      : normalizedPathname
  const match = appPathname.match(/^\/article\/([^/]+)\/?$/)
  return match ? decodeURIComponent(match[1]) : ''
}

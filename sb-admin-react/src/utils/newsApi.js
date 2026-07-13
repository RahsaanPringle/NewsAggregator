export const NEWS_API_BASE_URL = String(import.meta.env.VITE_NEWS_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '')

export function buildNewsApiUrl(routePath) {
  const normalizedPath = routePath.startsWith('/') ? routePath : `/${routePath}`
  return `${NEWS_API_BASE_URL}${normalizedPath}`
}

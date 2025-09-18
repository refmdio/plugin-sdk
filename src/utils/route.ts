export function resolveDocId(route?: string | null) {
  try {
    const src = route || (typeof location !== 'undefined' ? location.pathname + location.search + location.hash : '')
    const base = typeof location !== 'undefined' ? location.origin : 'http://localhost'
    const u = new URL(src, base)
    const match = u.pathname.match(/([0-9a-fA-F-]{36})(?:$|[?/])/)
    if (match && match[1]) return match[1]
    const segments = u.pathname.split('/').filter(Boolean)
    if (segments.length > 0) return segments[segments.length - 1]
  } catch {}
  return ''
}

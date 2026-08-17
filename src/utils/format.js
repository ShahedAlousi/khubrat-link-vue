// دوال لتنسيق النصوص أو الأرقام (مثلاً تحويل التاريخ لشكل مقروء).

export function formatCurrency(value) {
  const number = Number(value ?? 0)
  return number.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function initials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/**
 * Make a backend storage URL usable in <img src>.
 * ngrok's free interstitial blocks browser image requests unless the skip
 * flag is present — <img> cannot send custom headers, so it goes on the query string.
 */
export function toMediaUrl(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('ngrok')) {
      parsed.searchParams.set('ngrok-skip-browser-warning', 'true')
    }
    return parsed.toString()
  } catch {
    return url
  }
}

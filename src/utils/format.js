// دوال لتنسيق النصوص أو الأرقام (مثلاً تحويل التاريخ لشكل مقروء).

import { currentIntlLocale } from '@/i18n/helpers'
import { t } from '@/i18n/helpers'

export function formatCurrency(value) {
  const number = Number(value ?? 0)
  return number.toLocaleString(currentIntlLocale(), {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatDate(value) {
  if (!value) return t('common.emDash')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(currentIntlLocale(), { year: 'numeric', month: 'short', day: 'numeric' })
}

export function initials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/** Normalize API logo/media paths to `/storage/...` (handles full URLs and relative paths). */
export function resolveStoragePath(url, { companyId } = {}) {
  if (!url) return ''

  const raw = String(url).trim()
  if (!raw || raw.startsWith('blob:') || raw.startsWith('data:')) return raw

  let path = raw

  if (/^https?:\/\//i.test(raw)) {
    try {
      path = new URL(raw).pathname
    } catch {
      return raw
    }
  } else if (!raw.startsWith('/')) {
    path = `/${raw}`
  }

  if (path.startsWith('/storage/')) return path
  if (path.startsWith('/company_logos/')) return `/storage${path}`
  if (path.startsWith('/storage')) return path.startsWith('/storage/') ? path : `/storage/${path.slice('/storage'.length).replace(/^\//, '')}`

  const relative = path.replace(/^\//, '')
  if (relative.startsWith('company_logos/')) return `/storage/${relative}`
  if (relative.startsWith('storage/')) return `/${relative}`

  if (companyId && !relative.includes('/')) {
    return `/storage/company_logos/${companyId}/${relative}`
  }

  return `/storage/${relative}`
}

export function toMediaUrl(url, cacheBust = '', { companyId } = {}) {
  if (!url) return ''

  const raw = String(url).trim()
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw

  const storagePath = resolveStoragePath(raw, { companyId })
  if (!storagePath.startsWith('/storage/')) return raw

  // In dev, load from the API host directly (Laravel serves /storage on :8000).
  if (import.meta.env.DEV) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
    const apiOrigin = new URL(apiBase, typeof window !== 'undefined' ? window.location.href : 'http://localhost')
    const suffix = cacheBust ? `?v=${encodeURIComponent(cacheBust)}` : ''
    return `${apiOrigin.origin}${storagePath}${suffix}`
  }

  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
    const apiOrigin = new URL(apiBase, typeof window !== 'undefined' ? window.location.href : 'http://localhost')
    const absolute = new URL(storagePath, apiOrigin.origin)

    if (absolute.hostname.includes('ngrok')) {
      absolute.searchParams.set('ngrok-skip-browser-warning', 'true')
    }
    if (cacheBust) absolute.searchParams.set('v', String(cacheBust))

    return absolute.toString()
  } catch {
    return storagePath
  }
}

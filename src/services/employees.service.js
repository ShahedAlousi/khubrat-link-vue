import api from './api'
import { t } from '@/i18n/helpers'
import {
  toRelativeAttachmentPath,
  resolveAttachmentDisplayUrl
} from '@/services/managementRequests.service'

/** Normalize list payloads that may be a bare array or a Laravel paginator. */
function unwrapList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function fileNameFromStorageUrl(url, fallback) {
  try {
    const path = new URL(url, window.location.origin).pathname
    const base = path.split('/').filter(Boolean).pop()
    return base || fallback
  } catch {
    return fallback
  }
}

function triggerBrowserDownload(blob, filename) {
  const url = window.URL.createObjectURL(new Blob([blob]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

async function parseApiError(err) {
  const data = err.raw?.response?.data
  if (data instanceof Blob && data.type?.includes('json')) {
    try {
      const json = JSON.parse(await data.text())
      return {
        status: err.status,
        message: json.message || err.message || t('common.tryAgain'),
        errors: json.errors || null,
        raw: err.raw
      }
    } catch {
      // fall through
    }
  }
  return err
}

export const employeesService = {
  /**
   * GET /api/hr/employees
   * @param {Record<string, unknown>} [params]
   */
  list(params = {}) {
    return api.get('/hr/employees', { params }).then((res) => unwrapList(res.data?.data ?? res.data))
  },

  /**
   * GET /api/hr/employees/{employee}
   * @param {string} employeeId
   */
  get(employeeId) {
    return api.get(`/hr/employees/${employeeId}`).then((res) => res.data?.data ?? res.data)
  },

  /**
   * GET /api/management/employees
   * Returns only employees in the authenticated department manager's department.
   * @param {Record<string, unknown>} [params]
   */
  listForDepartmentManager(params = {}) {
    return api
      .get('/management/employees', { params })
      .then((res) => unwrapList(res.data?.data ?? res.data))
  },

  /**
   * GET /api/management/employees/{employee}
   * @param {string} employeeId
   */
  getForDepartmentManager(employeeId) {
    return api
      .get(`/management/employees/${employeeId}`)
      .then((res) => res.data?.data ?? res.data)
  },

  /**
   * GET /api/hr/employees/{employee}/profile-overview
   * @param {string} employeeId
   */
  profileOverview(employeeId) {
    return api.get(`/hr/employees/${employeeId}/profile-overview`).then((res) => res.data?.data ?? res.data)
  },

  /**
   * POST /api/hr/employees
   * @param {object} payload
   */
  create(payload) {
    return api.post('/hr/employees', payload).then((res) => res.data)
  },

  /**
   * PUT /api/hr/employees/{employee}
   * @param {string} employeeId
   * @param {object} payload
   */
  update(employeeId, payload) {
    return api.put(`/hr/employees/${employeeId}`, payload).then((res) => res.data)
  },

  /**
   * DELETE /api/hr/employees/{employee}
   * @param {string} employeeId
   */
  remove(employeeId) {
    return api.delete(`/hr/employees/${employeeId}`).then((res) => res.data)
  },

  /**
   * GET /api/hr/employees/import/template
   * Downloads the ready-made Excel template for bulk employee import.
   */
  downloadImportTemplate() {
    return api
      .get('/hr/employees/import/template', { responseType: 'blob' })
      .then((res) => {
        if (res.data?.type?.includes('json')) {
          return res.data.text().then((text) => {
            const json = JSON.parse(text)
            return Promise.reject({
              status: res.status,
              message: json.message || t('staff.downloadTemplateFailed'),
              errors: json.errors || null
            })
          })
        }

        const disposition = res.headers['content-disposition'] || ''
        let filename = 'employee-import-template.xlsx'
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (match?.[1]) filename = decodeURIComponent(match[1].replace(/['"]/g, ''))

        const url = window.URL.createObjectURL(new Blob([res.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      })
      .catch((err) => parseApiError(err).then((normalized) => Promise.reject(normalized)))
  },

  /**
   * Download a file from Laravel public storage (identity photo, certificate, …).
   * In dev, routes through Vite `/storage` proxy (same-origin) to avoid CORS.
   * @param {string} rawUrl
   * @param {string} [fallbackFilename]
   */
  downloadStorageFile(rawUrl, fallbackFilename = 'document') {
    const relative = toRelativeAttachmentPath(rawUrl)
    if (!relative) {
      return Promise.reject({ message: t('common.tryAgain') })
    }

    const filename = fileNameFromStorageUrl(rawUrl, fallbackFilename)
    const isDev = import.meta.env.DEV
    const requestUrl = isDev ? relative : resolveAttachmentDisplayUrl(rawUrl)

    return api
      .get(requestUrl, {
        ...(isDev && typeof window !== 'undefined' ? { baseURL: window.location.origin } : {}),
        responseType: 'blob',
        headers: { Accept: '*/*' }
      })
      .then(async (res) => {
        const blob = res.data
        if (!(blob instanceof Blob)) {
          triggerBrowserDownload(blob, filename)
          return
        }

        const type = (blob.type || '').toLowerCase()
        if (type.includes('text/html') || type.includes('application/json')) {
          let message = t('common.tryAgain')
          try {
            const text = await blob.text()
            if (type.includes('json')) {
              const json = JSON.parse(text)
              if (json?.message) message = json.message
            }
          } catch {
            // keep default message
          }
          return Promise.reject({ message })
        }

        triggerBrowserDownload(blob, filename)
      })
      .catch((err) => parseApiError(err).then((normalized) => Promise.reject(normalized)))
  },

  /**
   * POST /api/hr/employees/import
   * All-or-nothing import from Excel/CSV.
   * @param {File} file
   */
  importFromFile(file) {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post('/hr/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then((res) => res.data)
  }
}

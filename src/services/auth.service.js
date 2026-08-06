import api from './api'

/**
 * Auth module — maps 1:1 to the "المصادقة (Authentication)" tag in the
 * OpenAPI spec. This is intentionally the only auth surface implemented,
 * per project scope.
 */
export const authService = {
  /**
   * POST /api/auth/login
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ user: object, company: object, token: string }>}
   */
  login({ email, password }) {
    return api.post('/auth/login', { email, password }).then((res) => res.data.data)
  },

  /**
   * POST /api/auth/forgot-password
   * @param {string} email
   */
  forgotPassword(email) {
    return api.post('/auth/forgot-password', { email }).then((res) => res.data)
  },

  /**
   * POST /api/auth/reset-password
   * @param {{ email: string, token: string, password: string }} payload
   */
  resetPassword(payload) {
    return api.post('/auth/reset-password', payload).then((res) => res.data)
  },

  /**
   * POST /api/auth/complete-first-login (requires an authenticated session)
   * @param {{ password: string, password_confirmation: string }} payload
   */
  completeFirstLogin(payload) {
    return api.post('/auth/complete-first-login', payload).then((res) => res.data)
  },

  /**
   * POST /api/auth/logout (requires an authenticated session)
   * Invalidates the current bearer token on the server.
   */
  logout() {
    return api.post('/auth/logout').then((res) => res.data)
  }
}

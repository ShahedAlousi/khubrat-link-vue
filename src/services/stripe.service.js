import api from './api'

/**
 * Stripe checkout session status (frontend never calls /stripe/webhook).
 * GET /api/stripe/checkout-sessions/{session_id}
 */
export const stripeService = {
  /**
   * @param {string} sessionId Stripe Checkout Session id (cs_...)
   * @returns {Promise<{ status: 'completed'|'processing'|'not_completed', [key: string]: unknown }>}
   */
  getCheckoutSession(sessionId) {
    return api
      .get(`/stripe/checkout-sessions/${encodeURIComponent(sessionId)}`)
      .then((res) => res.data?.data ?? res.data)
  }
}

const STORAGE_KEY = 'khubrat_pending_checkout'

/**
 * Persist checkout context before leaving the app for Stripe (full-page redirect).
 * Pinia state is lost on return; session_id also arrives via ?session_id= on success.
 */
export function savePendingCheckout({ sessionId, email = '', context = 'signup' } = {}) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sessionId: sessionId || null,
        email: email || '',
        context: context === 'renew' ? 'renew' : 'signup',
        savedAt: Date.now()
      })
    )
  } catch {
    // sessionStorage may be unavailable; Stripe still returns session_id in the URL
  }
}

export function readPendingCheckout() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      sessionId: parsed?.sessionId || null,
      email: parsed?.email || '',
      context: parsed?.context === 'renew' ? 'renew' : 'signup'
    }
  } catch {
    return null
  }
}

export function clearPendingCheckout() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

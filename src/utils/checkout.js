/**
 * Normalize paid-register / renew API payloads into a single checkout shape.
 * Backend may put fields at the top level or under `data`.
 */
export function resolveCheckout(response) {
  const data = response?.data && typeof response.data === 'object' ? response.data : {}

  const paymentUrl =
    response?.payment_url ||
    response?.checkout_url ||
    data.payment_url ||
    data.checkout_url ||
    data.session_url ||
    data.url ||
    null

  const sessionId =
    response?.transaction_reference ||
    response?.session_id ||
    data.transaction_reference ||
    data.session_id ||
    null

  const paymentRequired = Boolean(
    response?.payment_required ?? data.payment_required ?? paymentUrl
  )

  return {
    paymentRequired: paymentRequired && Boolean(paymentUrl),
    paymentUrl: paymentUrl || null,
    sessionId: sessionId || null
  }
}

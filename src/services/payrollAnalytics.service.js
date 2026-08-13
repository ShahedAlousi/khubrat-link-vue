import api from './api'
import { isValidAnalyticsYear, isValidAnalyticsMonth } from '@/utils/validators'

/**
 * GET /api/payrolls/analytics
 * Query: year? (integer), month? (integer) — both optional per OpenAPI contract.
 */
export const payrollAnalyticsService = {
  /**
   * @param {{ year?: number|string, month?: number|string }} [params]
   */
  getAnalytics(params = {}) {
    const query = {}

    if (params.year !== undefined && params.year !== null && params.year !== '') {
      if (!isValidAnalyticsYear(params.year)) {
        return Promise.reject({ message: 'Year must be a valid integer between 2000 and 2100.' })
      }
      query.year = Number(params.year)
    }

    if (params.month !== undefined && params.month !== null && params.month !== '') {
      if (!isValidAnalyticsMonth(params.month)) {
        return Promise.reject({ message: 'Month must be an integer between 1 and 12.' })
      }
      query.month = Number(params.month)
    }

    return api.get('/payrolls/analytics', { params: query }).then((res) => res.data?.data ?? res.data)
  }
}

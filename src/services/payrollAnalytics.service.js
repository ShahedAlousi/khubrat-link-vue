import api from './api'
import { isValidAnalyticsYear, isValidAnalyticsMonth } from '@/utils/validators'
import { t } from '@/i18n/helpers'

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
        return Promise.reject({ message: t('validation.analyticsYear') })
      }
      query.year = Number(params.year)
    }

    if (params.month !== undefined && params.month !== null && params.month !== '') {
      if (!isValidAnalyticsMonth(params.month)) {
        return Promise.reject({ message: t('validation.analyticsMonth') })
      }
      query.month = Number(params.month)
    }

    return api.get('/payrolls/analytics', { params: query }).then((res) => res.data?.data ?? res.data)
  }
}

import api from './api'
import { isValidAnalyticsYear } from '@/utils/validators'

const BASE = '/analytics/hr'

function unwrap(response) {
  if (!response || !response.data) throw new Error('Invalid API response')
  if (response.data.success !== true) throw new Error('API reported failure')
  return response.data.data
}

export const hrAnalyticsService = {
  async getRealtimeHeadcount() {
    const res = await api.get(`${BASE}/realtime-headcount`)
    return unwrap(res)
  },

  async getDailyVerificationRate(params = {}) {
    // params: { date, end_date }
    const res = await api.get(`${BASE}/daily-verification-rate`, { params })
    return unwrap(res)
  },

  async getTurnoverRate(params = {}) {
    // params: { year, quarter }
    if (params.year !== undefined && !isValidAnalyticsYear(params.year)) {
      throw new Error('Invalid year parameter')
    }
    if (params.quarter !== undefined) {
      const q = Number(params.quarter)
      if (![1, 2, 3, 4].includes(q)) throw new Error('quarter must be 1..4')
    }

    const res = await api.get(`${BASE}/turnover-rate`, { params })
    return unwrap(res)
  },

  async getDemographics() {
    const res = await api.get(`${BASE}/demographics`)
    return unwrap(res)
  },

  async getDepartmentBudgets(params = {}) {
    // params: { year, month }
    if (params.year !== undefined && !isValidAnalyticsYear(params.year)) {
      throw new Error('Invalid year parameter')
    }
    if (params.month !== undefined) {
      const m = Number(params.month)
      if (m < 1 || m > 12) throw new Error('month must be 1..12')
    }

    const res = await api.get(`${BASE}/department-budgets`, { params })
    return unwrap(res)
  },

  async getPerformanceDistribution(params = {}) {
    // params: { year }
    if (params.year !== undefined && !isValidAnalyticsYear(params.year)) {
      throw new Error('Invalid year parameter')
    }

    const res = await api.get(`${BASE}/performance-distribution`, { params })
    return unwrap(res)
  }
}
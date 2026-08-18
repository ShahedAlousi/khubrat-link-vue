import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { payrollAnalyticsService } from '@/services/payrollAnalytics.service'
import { t } from '@/i18n/helpers'

export const usePayrollAnalyticsStore = defineStore('payrollAnalytics', () => {
  const analytics = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })

  const summary = computed(() => analytics.value?.current_month_summary ?? null)
  const totalSavings = computed(() => Number(analytics.value?.total_savings ?? 0))
  const monthlyCostTrend = computed(() => analytics.value?.monthly_cost_trend ?? [])

  /** Month-over-month % change of total_cost from the trend series. */
  const costMomPercent = computed(() => {
    const trend = monthlyCostTrend.value
    if (!Array.isArray(trend) || trend.length < 2) return null

    const currentMonth = summary.value?.month ?? filters.value.month
    const idx = trend.findIndex((row) => Number(row.month) === Number(currentMonth))
    if (idx <= 0) return null

    const current = Number(trend[idx].total_cost) || 0
    const previous = Number(trend[idx - 1].total_cost) || 0
    if (previous === 0) return null

    return ((current - previous) / previous) * 100
  })

  async function fetchAnalytics(params = {}) {
    const next = {
      year: params.year ?? filters.value.year,
      month: params.month ?? filters.value.month
    }

    loading.value = true
    error.value = null
    try {
      const data = await payrollAnalyticsService.getAnalytics(next)
      analytics.value = data
      filters.value = { year: Number(next.year), month: Number(next.month) }
      return data
    } catch (err) {
      error.value = err.message || t('payroll.loadAnalyticsFailed')
      throw err
    } finally {
      loading.value = false
    }
  }

  function setFilters({ year, month }) {
    if (year !== undefined) filters.value.year = Number(year)
    if (month !== undefined) filters.value.month = Number(month)
  }

  function clear() {
    analytics.value = null
    error.value = null
  }

  return {
    analytics,
    loading,
    error,
    filters,
    summary,
    totalSavings,
    monthlyCostTrend,
    costMomPercent,
    fetchAnalytics,
    setFilters,
    clear
  }
})

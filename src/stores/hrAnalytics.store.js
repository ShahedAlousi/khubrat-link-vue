import { ref } from 'vue'
import { defineStore } from 'pinia'
import { hrAnalyticsService } from '@/services/hrAnalytics.service'

export const useHrAnalyticsStore = defineStore('hrAnalytics', () => {
  const realtimeHeadcount = ref(null)
  const loadingHeadcount = ref(false)
  const errorHeadcount = ref(null)

  const dailyVerification = ref(null)
  const loadingDaily = ref(false)
  const errorDaily = ref(null)

  const turnover = ref(null)
  const loadingTurnover = ref(false)
  const errorTurnover = ref(null)

  const demographics = ref(null)
  const loadingDemographics = ref(false)
  const errorDemographics = ref(null)

  const departmentBudgets = ref(null)
  const loadingDepartmentBudgets = ref(false)
  const errorDepartmentBudgets = ref(null)

  const performanceDistribution = ref(null)
  const loadingPerformance = ref(false)
  const errorPerformance = ref(null)

  let _pollTimer = null

  async function fetchRealtimeHeadcount() {
    loadingHeadcount.value = true
    errorHeadcount.value = null
    try {
      const data = await hrAnalyticsService.getRealtimeHeadcount()
      realtimeHeadcount.value = data
      return data
    } catch (err) {
      errorHeadcount.value = err.message || String(err)
      throw err
    } finally {
      loadingHeadcount.value = false
    }
  }

  function startRealtimePolling(intervalMs = 30000) {
    stopRealtimePolling()
    _pollTimer = setInterval(() => {
      fetchRealtimeHeadcount().catch(() => {})
    }, intervalMs)
  }

  function stopRealtimePolling() {
    if (_pollTimer) {
      clearInterval(_pollTimer)
      _pollTimer = null
    }
  }

  async function fetchDailyVerificationRate(params = {}) {
    loadingDaily.value = true
    errorDaily.value = null
    try {
      const data = await hrAnalyticsService.getDailyVerificationRate(params)
      dailyVerification.value = data
      return data
    } catch (err) {
      errorDaily.value = err.message || String(err)
      throw err
    } finally {
      loadingDaily.value = false
    }
  }

  async function fetchTurnoverRate(params = {}) {
    loadingTurnover.value = true
    errorTurnover.value = null
    try {
      const data = await hrAnalyticsService.getTurnoverRate(params)
      turnover.value = data
      return data
    } catch (err) {
      errorTurnover.value = err.message || String(err)
      throw err
    } finally {
      loadingTurnover.value = false
    }
  }

  async function fetchDemographics() {
    loadingDemographics.value = true
    errorDemographics.value = null
    try {
      const data = await hrAnalyticsService.getDemographics()
      demographics.value = data
      return data
    } catch (err) {
      errorDemographics.value = err.message || String(err)
      throw err
    } finally {
      loadingDemographics.value = false
    }
  }

  async function fetchDepartmentBudgets(params = {}) {
    loadingDepartmentBudgets.value = true
    errorDepartmentBudgets.value = null
    try {
      const data = await hrAnalyticsService.getDepartmentBudgets(params)
      departmentBudgets.value = data
      return data
    } catch (err) {
      errorDepartmentBudgets.value = err.message || String(err)
      throw err
    } finally {
      loadingDepartmentBudgets.value = false
    }
  }

  async function fetchPerformanceDistribution(params = {}) {
    loadingPerformance.value = true
    errorPerformance.value = null
    try {
      const data = await hrAnalyticsService.getPerformanceDistribution(params)
      performanceDistribution.value = data
      return data
    } catch (err) {
      errorPerformance.value = err.message || String(err)
      throw err
    } finally {
      loadingPerformance.value = false
    }
  }

  function clear() {
    realtimeHeadcount.value = null
    dailyVerification.value = null
    turnover.value = null
    demographics.value = null
    departmentBudgets.value = null
    performanceDistribution.value = null
    errorHeadcount.value = null
    errorDaily.value = null
    errorTurnover.value = null
    errorDemographics.value = null
    errorDepartmentBudgets.value = null
    errorPerformance.value = null
  }

  return {
    realtimeHeadcount,
    loadingHeadcount,
    errorHeadcount,
    dailyVerification,
    loadingDaily,
    errorDaily,
    turnover,
    loadingTurnover,
    errorTurnover,
    demographics,
    loadingDemographics,
    errorDemographics,
    departmentBudgets,
    loadingDepartmentBudgets,
    errorDepartmentBudgets,
    performanceDistribution,
    loadingPerformance,
    errorPerformance,
    fetchRealtimeHeadcount,
    startRealtimePolling,
    stopRealtimePolling,
    fetchDailyVerificationRate,
    fetchTurnoverRate,
    fetchDemographics,
    fetchDepartmentBudgets,
    fetchPerformanceDistribution,
    clear
  }
})
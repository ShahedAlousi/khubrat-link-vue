import { ref } from 'vue'
import { defineStore } from 'pinia'
import { holidaysService, weeklyHolidaysService } from '@/services/holidays.service'

export const useHolidaysStore = defineStore('holidays', () => {
  const holidays = ref([])
  const weeklyRestDays = ref(['friday', 'saturday']) // matches the source design's default
  const isSyrianSeeded = ref(false) // no "is seeded" flag exists in the API; tracked locally

  const loading = ref(false)
  const seeding = ref(false)
  const savingRestDays = ref(false)
  const error = ref(null)

  async function fetchHolidays(companyId) {
    loading.value = true
    error.value = null
    try {
      const data = await holidaysService.list(companyId)
      holidays.value = Array.isArray(data) ? data : []
      console.log('[Holidays] Fetch holidays succeeded:', holidays.value)
      return holidays.value
    } catch (err) {
      error.value = err.message
      console.error('[Holidays] Fetch holidays failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchWeeklyRestDays(companyId) {
    error.value = null
    try {
      const data = await weeklyHolidaysService.get(companyId)
      if (Array.isArray(data?.weekly_holidays)) weeklyRestDays.value = data.weekly_holidays
      else if (Array.isArray(data)) weeklyRestDays.value = data
      console.log('[Holidays] Fetch weekly rest days succeeded:', weeklyRestDays.value)
      return weeklyRestDays.value
    } catch (err) {
      error.value = err.message
      console.error('[Holidays] Fetch weekly rest days failed:', err)
      throw err
    }
  }

  async function createHoliday(companyId, payload) {
    error.value = null
    try {
      const result = await holidaysService.create(companyId, payload)
      console.log('[Holidays] Create holiday succeeded:', result)
      await fetchHolidays(companyId)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Holidays] Create holiday failed:', err)
      throw err
    }
  }

  async function updateHoliday(companyId, holidayId, payload) {
    error.value = null
    try {
      const result = await holidaysService.update(companyId, holidayId, payload)
      console.log('[Holidays] Update holiday succeeded:', result)
      await fetchHolidays(companyId)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Holidays] Update holiday failed:', err)
      throw err
    }
  }

  async function removeHoliday(companyId, holidayId) {
    error.value = null
    try {
      const result = await holidaysService.remove(companyId, holidayId)
      console.log('[Holidays] Delete holiday succeeded:', result)
      holidays.value = holidays.value.filter((h) => h.id !== holidayId)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Holidays] Delete holiday failed:', err)
      throw err
    }
  }

  async function seedSyrianDefaults(companyId) {
    seeding.value = true
    error.value = null
    try {
      const result = await holidaysService.seedDefaults(companyId)
      isSyrianSeeded.value = true
      console.log('[Holidays] Seed Syrian defaults succeeded:', result)
      await fetchHolidays(companyId)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Holidays] Seed Syrian defaults failed:', err)
      throw err
    } finally {
      seeding.value = false
    }
  }

  async function removeSyrianDefaults(companyId) {
    seeding.value = true
    error.value = null
    try {
      const result = await holidaysService.removeDefaults(companyId)
      isSyrianSeeded.value = false
      console.log('[Holidays] Remove Syrian defaults succeeded:', result)
      await fetchHolidays(companyId)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Holidays] Remove Syrian defaults failed:', err)
      throw err
    } finally {
      seeding.value = false
    }
  }

  async function saveWeeklyRestDays(companyId, days) {
    savingRestDays.value = true
    error.value = null
    try {
      const result = await weeklyHolidaysService.update(companyId, days)
      weeklyRestDays.value = days
      console.log('[Holidays] Save weekly rest days succeeded:', result)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Holidays] Save weekly rest days failed:', err)
      throw err
    } finally {
      savingRestDays.value = false
    }
  }

  return {
    holidays,
    weeklyRestDays,
    isSyrianSeeded,
    loading,
    seeding,
    savingRestDays,
    error,
    fetchHolidays,
    fetchWeeklyRestDays,
    createHoliday,
    updateHoliday,
    removeHoliday,
    seedSyrianDefaults,
    removeSyrianDefaults,
    saveWeeklyRestDays
  }
})

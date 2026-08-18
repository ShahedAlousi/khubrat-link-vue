import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { attendancePolicyService } from '@/services/attendancePolicy.service'
import { t } from '@/i18n/helpers'

// Empty shape: the panel shows placeholders until the tenant's saved policy arrives.
const EMPTY_POLICY = {
  work_start_time: '',
  work_end_time: '',
  allowed_late_minutes: '',
  allowed_early_leave_minutes: '',
  allows_overtime: false,
  allowed_perimeter: '',
  latitude: null,
  longitude: null
}

export const useAttendancePolicyStore = defineStore('attendancePolicy', () => {
  const policy = reactive({ ...EMPTY_POLICY })
  const loading = ref(false)
  const loaded = ref(false)
  const savingPolicy = ref(false)
  const savingLocation = ref(false)
  const error = ref(null)

  function toNumberOrEmpty(value) {
    return value === null || value === undefined || value === '' ? '' : Number(value)
  }

  function toCoordinate(value) {
    return value === null || value === undefined || value === '' ? null : Number(value)
  }

  function applyPolicyData(data = {}) {
    if (data.work_start_time !== undefined) policy.work_start_time = data.work_start_time ?? ''
    if (data.work_end_time !== undefined) policy.work_end_time = data.work_end_time ?? ''
    if (data.allowed_late_minutes !== undefined) {
      policy.allowed_late_minutes = toNumberOrEmpty(data.allowed_late_minutes)
    }
    if (data.allowed_early_leave_minutes !== undefined) {
      policy.allowed_early_leave_minutes = toNumberOrEmpty(data.allowed_early_leave_minutes)
    }
    if (data.allows_overtime !== undefined) policy.allows_overtime = Boolean(data.allows_overtime)
    if (data.allowed_perimeter !== undefined || data.allowed_radius !== undefined) {
      policy.allowed_perimeter = toNumberOrEmpty(data.allowed_perimeter ?? data.allowed_radius)
    }
    if (data.latitude !== undefined || data.company_latitude !== undefined) {
      policy.latitude = toCoordinate(data.latitude ?? data.company_latitude)
    }
    if (data.longitude !== undefined || data.company_longitude !== undefined) {
      policy.longitude = toCoordinate(data.longitude ?? data.company_longitude)
    }
  }

  async function fetchPolicy(companyId) {
    loading.value = true
    error.value = null
    try {
      const data = await attendancePolicyService.getPolicy(companyId)
      applyPolicyData(data ?? {})
      loaded.value = true
      return data
    } catch (err) {
      error.value =
        err.response?.data?.message || err.message || t('policies.loadAttendanceFailed')
      console.error('[AttendancePolicy] Fetch failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function saveAttendancePolicy(companyId, payload) {
    savingPolicy.value = true
    error.value = null
    try {
      if (!payload.work_start_time || !payload.work_end_time) {
        throw new Error(t('policies.shiftTimesRequired'))
      }

      if (
        payload.allowed_late_minutes === '' ||
        payload.allowed_late_minutes === null ||
        payload.allowed_late_minutes === undefined
      ) {
        throw new Error(t('policies.delayRequired'))
      }

      if (
        payload.allowed_early_leave_minutes === '' ||
        payload.allowed_early_leave_minutes === null ||
        payload.allowed_early_leave_minutes === undefined
      ) {
        throw new Error(t('policies.earlyRequired'))
      }

      const policyPayload = {
        work_start_time: payload.work_start_time,
        work_end_time: payload.work_end_time,
        allowed_late_minutes: Number(payload.allowed_late_minutes),
        allowed_early_leave_minutes: Number(payload.allowed_early_leave_minutes),
        allows_overtime: Boolean(payload.allows_overtime)
      }

      const result = await attendancePolicyService.updatePolicy(companyId, policyPayload)
      applyPolicyData({ ...policyPayload, ...(result?.data ?? {}) })
      return result
    } catch (err) {
      error.value = err.response?.data?.message || err.message || t('policies.saveAttendanceFailed')
      throw err
    } finally {
      savingPolicy.value = false
    }
  }

  /**
   * دالة حفظ البصمة الجغرافية فقط (لزر الموقع)
   */
  async function saveLocationPolicy(companyId, payload) {
    savingLocation.value = true
    error.value = null
    try {
      if (payload.latitude === null || payload.longitude === null || payload.latitude === '' || payload.longitude === '') {
        throw new Error(t('policies.pickLocationFirst'))
      }

      const locationPayload = {
        allowed_perimeter: Number(payload.allowed_perimeter),
        latitude: Number(payload.latitude),
        longitude: Number(payload.longitude)
      }

      const result = await attendancePolicyService.updateLocation(companyId, locationPayload)
      applyPolicyData({ ...locationPayload, ...(result?.data ?? {}) })
      return result
    } catch (err) {
      error.value = err.response?.data?.message || err.message || t('policies.saveLocationFailed')
      throw err
    } finally {
      savingLocation.value = false
    }
  }

  return {
    policy,
    loading,
    loaded,
    savingPolicy,
    savingLocation,
    error,
    fetchPolicy,
    saveAttendancePolicy,
    saveLocationPolicy
  }
})

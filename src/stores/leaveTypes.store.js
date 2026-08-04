import { ref } from 'vue'
import { defineStore } from 'pinia'
import { leaveTypesService } from '@/services/leaveTypes.service'

export const useLeaveTypesStore = defineStore('leaveTypes', () => {
  const leaveTypes = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)

  async function fetchLeaveTypes(companyId) {
    loading.value = true
    error.value = null
    try {
      const data = await leaveTypesService.list(companyId)
      leaveTypes.value = Array.isArray(data) ? data : []
      console.log('[LeaveTypes] Fetch succeeded:', leaveTypes.value)
      return leaveTypes.value
    } catch (err) {
      error.value = err.message
      console.error('[LeaveTypes] Fetch failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ينشئ عدة أنواع إجازات دفعة واحدة (للفئات التي لا تملك id بعد)
  async function createLeaveTypesBulk(companyId, leaveTypesPayload) {
    saving.value = true
    error.value = null
    try {
      const result = await leaveTypesService.createMany(companyId, leaveTypesPayload)
      console.log('[LeaveTypes] Bulk create succeeded:', result)
      await fetchLeaveTypes(companyId)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[LeaveTypes] Bulk create failed:', err)
      throw err
    } finally {
      saving.value = false
    }
  }

  // يحدّث عدة أنواع إجازات دفعة واحدة (لكل عنصر يملك id فعلي)
  async function updateLeaveTypesBulk(companyId, leaveTypesPayload) {
    saving.value = true
    error.value = null
    try {
      const result = await leaveTypesService.updateMany(companyId, leaveTypesPayload)
      console.log('[LeaveTypes] Bulk update succeeded:', result)
      await fetchLeaveTypes(companyId)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[LeaveTypes] Bulk update failed:', err)
      throw err
    } finally {
      saving.value = false
    }
  }

  // يبدّل حالة تفعيل نوع إجازة واحد فوريًا (فقط لو يملك id حقيقي)
  async function toggleLeaveType(companyId, leaveType) {
    error.value = null
    try {
      const result = await leaveTypesService.toggle(companyId, leaveType.id)
      console.log('[LeaveTypes] Toggle succeeded:', result)
      const index = leaveTypes.value.findIndex((lt) => lt.id === leaveType.id)
      if (index !== -1) leaveTypes.value[index] = { ...leaveType, is_active: !leaveType.is_active }
      return result
    } catch (err) {
      error.value = err.message
      console.error('[LeaveTypes] Toggle failed:', err)
      throw err
    }
  }

  return {
    leaveTypes,
    loading,
    saving,
    error,
    fetchLeaveTypes,
    createLeaveTypesBulk,
    updateLeaveTypesBulk,
    toggleLeaveType
  }
})
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { leaveTypesService } from '@/services/leaveTypes.service'

// الفئات الثابتة المعروضة في جدول سياسات الإجازات.
// requiresProof يبدأ false دائماً — المدير يقرر لكل نوع إن كان ملف التوثيق مطلوباً.
export const LEAVE_TYPE_CATEGORIES = [
  { name: 'Maternity Leave', terms: 'Per occurrence maternity allocation', defaultValue: 90, allocationUnit: 'days', defaultActive: true, requiresProof: false },
  { name: 'Marriage Leave', terms: 'Per marriage event allocation', defaultValue: 7, allocationUnit: 'days', defaultActive: true, requiresProof: false },
  { name: 'Travel Leave', terms: 'Holiday relocation allocation', defaultValue: 15, allocationUnit: 'days', defaultActive: false, requiresProof: false },
  { name: 'Study/Exams Leave', terms: 'Accredited exam period allocation', defaultValue: 10, allocationUnit: 'days', defaultActive: true, requiresProof: false },
  { name: 'Sick Leave', terms: 'Medical absence allocation', defaultValue: 14, allocationUnit: 'days', defaultActive: true, requiresProof: false },
  { name: 'Hajj Leave', terms: 'Granted once per career cycle', defaultValue: 30, allocationUnit: 'days', defaultActive: false, requiresProof: false },
  { name: 'Compassionate Leave', terms: 'Bereavement / family emergency allocation', defaultValue: 3, allocationUnit: 'days', defaultActive: true, requiresProof: false },
  { name: 'Hourly Leave', terms: 'Short-duration leave requested in hours. Set the number of hours an employee may request.', defaultValue: 8, allocationUnit: 'hours', defaultActive: true, requiresProof: false }
]

export const FREE_DAYS_LEAVE_CATEGORY = {
  name: 'Paid Free Days Leave Allocation',
  terms: 'Independent annual balance. Deduct basic wage ONLY if free days requests exceed this specific balance in the calendar year.',
  defaultValue: 14,
  allocationUnit: 'days',
  defaultActive: true,
  requiresProof: false
}

function normalizeLeaveType(lt) {
  return {
    ...lt,
    allocation_unit: lt.allocation_unit || 'days',
    allocation_value: Number(lt.allocation_value ?? 0),
    requires_proof: Boolean(lt.requires_proof),
    is_active: Boolean(lt.is_active)
  }
}

export function toLeaveTypePayload(row) {
  return {
    ...(row.id ? { id: row.id } : {}),
    name: row.name,
    allocation_value: Number(row.allocation_value),
    allocation_unit: row.allocation_unit || 'days',
    requires_proof: Boolean(row.requires_proof),
    is_active: Boolean(row.is_active)
  }
}

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
      leaveTypes.value = (Array.isArray(data) ? data : []).map(normalizeLeaveType)
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
      const result = await leaveTypesService.createMany(companyId, leaveTypesPayload.map(toLeaveTypePayload))
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
      const result = await leaveTypesService.updateMany(companyId, leaveTypesPayload.map(toLeaveTypePayload))
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

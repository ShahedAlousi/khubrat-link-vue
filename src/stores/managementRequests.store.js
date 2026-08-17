import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  managementRequestsService,
  normalizeLeaveRequest,
  normalizeAdvanceRequest,
  normalizeOvertimeRequest
} from '@/services/managementRequests.service'
import { useAuthStore } from '@/stores/auth.store'

const EMPTY_META = { current_page: 1, last_page: 1, per_page: 15, total: 0, from: null, to: null }

export const useManagementRequestsStore = defineStore('managementRequests', () => {
  // ---------------------------------------------------------------- Leaves
  const inbox = ref([])
  const resolvedLog = ref([])
  const loading = ref(false)
  const actionLoading = ref(false)
  const error = ref(null)
  const selectedId = ref(null)
  const drawerOpen = ref(false)

  // -------------------------------------------------- Advances / Overtime
  const advances = ref([])
  const advancesMeta = ref({ ...EMPTY_META })
  const advancesLoading = ref(false)

  const overtime = ref([])
  const overtimeMeta = ref({ ...EMPTY_META })
  const overtimeLoading = ref(false)

  const requestDetails = ref(null)
  const detailsLoading = ref(false)

  const selectedRequest = computed(() => {
    return (
      inbox.value.find((row) => row.id === selectedId.value) ??
      resolvedLog.value.find((row) => row.id === selectedId.value) ??
      advances.value.find((row) => row.id === selectedId.value) ??
      overtime.value.find((row) => row.id === selectedId.value) ??
      null
    )
  })
  const pendingCount = computed(() => inbox.value.length)
  const resolvedCount = computed(() => resolvedLog.value.length)
  const advancesCount = computed(() => advances.value.length)
  const overtimeCount = computed(() => overtime.value.length)
  const totalPendingCount = computed(
    () => pendingCount.value + advancesCount.value + overtimeCount.value
  )

  function resolveRoleContext() {
    const role = useAuthStore().userRole
    if (role === 'hr_manager') return 'hr'
    if (role === 'department_manager') return 'manager'
    return null
  }

  const canActOnRequests = computed(() => Boolean(resolveRoleContext()))
  // Salary advances skip the department manager stage — HR only.
  const canViewAdvances = computed(() => resolveRoleContext() === 'hr')
  const canActOnAdvances = computed(() => resolveRoleContext() === 'hr')
  const canActOnOvertime = computed(() => Boolean(resolveRoleContext()))

  async function fetchInbox() {
    loading.value = true
    error.value = null
    try {
      const data = await managementRequestsService.inbox()
      inbox.value = Array.isArray(data) ? data : []
      return inbox.value
    } catch (err) {
      error.value = err.message || 'Failed to load leave requests.'
      throw err
    } finally {
      loading.value = false
    }
  }

  function openDrawer(id) {
    selectedId.value = id
    drawerOpen.value = true
  }

  function closeDrawer() {
    drawerOpen.value = false
    selectedId.value = null
    requestDetails.value = null
  }

  function archiveResolved(row, patch, normalize = normalizeLeaveRequest) {
    const normalized = normalize({ ...row, ...patch })
    if (!normalized) return
    resolvedLog.value.unshift(normalized)
  }

  async function approveRequest(id) {
    const roleContext = resolveRoleContext()
    if (!roleContext) {
      const err = { message: 'Your role is not authorized to approve leave requests.' }
      error.value = err.message
      throw err
    }

    actionLoading.value = true
    error.value = null
    try {
      await managementRequestsService.executeAction(id, {
        action: 'approve',
        role_context: roleContext
      })

      const index = inbox.value.findIndex((row) => row.id === id)
      if (index !== -1) {
        const [removed] = inbox.value.splice(index, 1)
        archiveResolved(removed, { status: 'approved', resolved_at: new Date().toISOString() })
      }

      if (selectedId.value === id) closeDrawer()
      return true
    } catch (err) {
      error.value = err.message || 'Failed to approve leave request.'
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  async function rejectRequest(id, rejectionReason) {
    const roleContext = resolveRoleContext()
    if (!roleContext) {
      const err = { message: 'Your role is not authorized to reject leave requests.' }
      error.value = err.message
      throw err
    }

    actionLoading.value = true
    error.value = null
    try {
      await managementRequestsService.executeAction(id, {
        action: 'reject',
        role_context: roleContext,
        rejection_reason: rejectionReason
      })

      const index = inbox.value.findIndex((row) => row.id === id)
      if (index !== -1) {
        const [removed] = inbox.value.splice(index, 1)
        archiveResolved(removed, {
          status: 'rejected',
          rejection_reason: rejectionReason,
          resolved_at: new Date().toISOString()
        })
      }

      if (selectedId.value === id) closeDrawer()
      return true
    } catch (err) {
      error.value = err.message || 'Failed to reject leave request.'
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  // -------------------------------------------------------------- Advances
  async function fetchAdvances(params = {}) {
    if (!canViewAdvances.value) {
      advances.value = []
      advancesMeta.value = { ...EMPTY_META }
      return advances.value
    }

    advancesLoading.value = true
    error.value = null
    try {
      const { items, meta } = await managementRequestsService.listAdvances(params)
      advances.value = items
      advancesMeta.value = meta
      return advances.value
    } catch (err) {
      error.value = err.message || 'Failed to load salary advance requests.'
      throw err
    } finally {
      advancesLoading.value = false
    }
  }

  async function fetchAdvanceDetails(id) {
    detailsLoading.value = true
    error.value = null
    try {
      const details = await managementRequestsService.getAdvance(id)
      requestDetails.value = details
      return details
    } catch (err) {
      error.value = err.message || 'Failed to load advance request details.'
      throw err
    } finally {
      detailsLoading.value = false
    }
  }

  async function runAdvanceAction(id, payload, failureMessage) {
    if (!canActOnAdvances.value) {
      const err = { message: 'Only HR managers can decide on salary advance requests.' }
      error.value = err.message
      throw err
    }

    actionLoading.value = true
    error.value = null
    try {
      await managementRequestsService.executeAdvanceAction(id, {
        ...payload,
        role_context: 'hr'
      })

      const index = advances.value.findIndex((row) => row.id === id)
      if (index !== -1) {
        const [removed] = advances.value.splice(index, 1)
        archiveResolved(
          removed,
          {
            status: payload.action === 'approve' ? 'approved' : 'rejected',
            rejection_reason: payload.rejection_reason ?? null,
            resolved_at: new Date().toISOString()
          },
          normalizeAdvanceRequest
        )
      }

      if (selectedId.value === id) closeDrawer()
      return true
    } catch (err) {
      error.value = err.message || failureMessage
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  function approveAdvance(id) {
    return runAdvanceAction(id, { action: 'approve' }, 'Failed to approve advance request.')
  }

  function rejectAdvance(id, rejectionReason) {
    return runAdvanceAction(
      id,
      { action: 'reject', rejection_reason: rejectionReason },
      'Failed to reject advance request.'
    )
  }

  /** HR-only: mark one installment of an approved advance as paid. */
  async function payAdvanceInstallment(advanceId, installmentId) {
    if (!canActOnAdvances.value) {
      const err = { message: 'Only HR managers can settle advance installments.' }
      error.value = err.message
      throw err
    }

    actionLoading.value = true
    error.value = null
    try {
      const result = await managementRequestsService.payAdvanceInstallment(advanceId, installmentId)
      // Refresh details so the installment schedule reflects the new state.
      if (requestDetails.value?.id === advanceId) {
        await fetchAdvanceDetails(advanceId)
      }
      return result
    } catch (err) {
      error.value = err.message || 'Failed to mark the installment as paid.'
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  // -------------------------------------------------------------- Overtime
  async function fetchOvertime(params = {}) {
    overtimeLoading.value = true
    error.value = null
    try {
      const { items, meta } = await managementRequestsService.listOvertime(params)
      overtime.value = items
      overtimeMeta.value = meta
      return overtime.value
    } catch (err) {
      error.value = err.message || 'Failed to load overtime requests.'
      throw err
    } finally {
      overtimeLoading.value = false
    }
  }

  async function fetchOvertimeDetails(id) {
    detailsLoading.value = true
    error.value = null
    try {
      const details = await managementRequestsService.getOvertime(id)
      requestDetails.value = details
      return details
    } catch (err) {
      error.value = err.message || 'Failed to load overtime request details.'
      throw err
    } finally {
      detailsLoading.value = false
    }
  }

  async function runOvertimeAction(id, payload, failureMessage) {
    const roleContext = resolveRoleContext()
    if (!roleContext) {
      const err = { message: 'Your role is not authorized to decide on overtime requests.' }
      error.value = err.message
      throw err
    }

    actionLoading.value = true
    error.value = null
    try {
      await managementRequestsService.executeOvertimeAction(id, {
        ...payload,
        role_context: roleContext
      })

      const index = overtime.value.findIndex((row) => row.id === id)
      if (index !== -1) {
        const [removed] = overtime.value.splice(index, 1)
        archiveResolved(
          removed,
          {
            status: payload.action === 'approve' ? 'approved' : 'rejected',
            units_approved: payload.hours_approved ?? removed.units_requested,
            rejection_reason: payload.rejection_reason ?? null,
            review_notes: payload.review_notes ?? null,
            resolved_at: new Date().toISOString()
          },
          normalizeOvertimeRequest
        )
      }

      if (selectedId.value === id) closeDrawer()
      return true
    } catch (err) {
      error.value = err.message || failureMessage
      throw err
    } finally {
      actionLoading.value = false
    }
  }

  /**
   * @param {string} id
   * @param {{ hours_approved?: number|null, review_notes?: string|null }} [options]
   */
  function approveOvertime(id, options = {}) {
    return runOvertimeAction(
      id,
      {
        action: 'approve',
        hours_approved: options.hours_approved ?? null,
        review_notes: options.review_notes ?? null
      },
      'Failed to approve overtime request.'
    )
  }

  function rejectOvertime(id, rejectionReason, reviewNotes = null) {
    return runOvertimeAction(
      id,
      { action: 'reject', rejection_reason: rejectionReason, review_notes: reviewNotes },
      'Failed to reject overtime request.'
    )
  }

  function clear() {
    inbox.value = []
    resolvedLog.value = []
    advances.value = []
    advancesMeta.value = { ...EMPTY_META }
    overtime.value = []
    overtimeMeta.value = { ...EMPTY_META }
    requestDetails.value = null
    error.value = null
    closeDrawer()
  }

  return {
    inbox,
    resolvedLog,
    advances,
    advancesMeta,
    advancesLoading,
    overtime,
    overtimeMeta,
    overtimeLoading,
    requestDetails,
    detailsLoading,
    loading,
    actionLoading,
    error,
    selectedId,
    drawerOpen,
    selectedRequest,
    pendingCount,
    resolvedCount,
    advancesCount,
    overtimeCount,
    totalPendingCount,
    canActOnRequests,
    canViewAdvances,
    canActOnAdvances,
    canActOnOvertime,
    fetchInbox,
    openDrawer,
    closeDrawer,
    approveRequest,
    rejectRequest,
    fetchAdvances,
    fetchAdvanceDetails,
    approveAdvance,
    rejectAdvance,
    payAdvanceInstallment,
    fetchOvertime,
    fetchOvertimeDetails,
    approveOvertime,
    rejectOvertime,
    clear
  }
})

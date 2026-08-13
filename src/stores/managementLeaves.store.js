import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { managementLeavesService } from '@/services/managementLeaves.service'
import { useAuthStore } from '@/stores/auth.store'

export const useManagementLeavesStore = defineStore('managementLeaves', () => {
  const inbox = ref([])
  const resolvedLog = ref([])
  const loading = ref(false)
  const actionLoading = ref(false)
  const error = ref(null)
  const selectedId = ref(null)
  const drawerOpen = ref(false)

  const selectedRequest = computed(() => inbox.value.find((row) => row.id === selectedId.value) ?? null)
  const pendingCount = computed(() => inbox.value.length)
  const resolvedCount = computed(() => resolvedLog.value.length)

  function resolveRoleContext() {
    const role = useAuthStore().userRole
    if (role === 'hr_manager') return 'hr'
    if (role === 'department_manager') return 'manager'
    return null
  }

  const canActOnRequests = computed(() => Boolean(resolveRoleContext()))

  async function fetchInbox() {
    loading.value = true
    error.value = null
    try {
      const data = await managementLeavesService.inbox()
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
      await managementLeavesService.executeAction(id, {
        action: 'approve',
        role_context: roleContext
      })

      const index = inbox.value.findIndex((row) => row.id === id)
      if (index !== -1) {
        const [removed] = inbox.value.splice(index, 1)
        resolvedLog.value.unshift({ ...removed, status: 'approved', resolved_at: new Date().toISOString() })
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
      await managementLeavesService.executeAction(id, {
        action: 'reject',
        role_context: roleContext,
        rejection_reason: rejectionReason
      })

      const index = inbox.value.findIndex((row) => row.id === id)
      if (index !== -1) {
        const [removed] = inbox.value.splice(index, 1)
        resolvedLog.value.unshift({
          ...removed,
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

  function clear() {
    inbox.value = []
    resolvedLog.value = []
    error.value = null
    closeDrawer()
  }

  return {
    inbox,
    resolvedLog,
    loading,
    actionLoading,
    error,
    selectedId,
    drawerOpen,
    selectedRequest,
    pendingCount,
    resolvedCount,
    canActOnRequests,
    fetchInbox,
    openDrawer,
    closeDrawer,
    approveRequest,
    rejectRequest,
    clear
  }
})

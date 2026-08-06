import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { employeesService } from '@/services/employees.service'
import { hrManagersService } from '@/services/hrManagers.service'
import { departmentsService } from '@/services/departments.service'
import { useAuthStore } from '@/stores/auth.store'

export const STAFF_TYPE = {
  HR: 'HR',
  REGULAR: 'REGULAR'
}

function asNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * Normalize employee / HR manager API rows into a shared table shape.
 * @param {object} row
 * @param {'HR'|'REGULAR'} staffType
 */
export function normalizeStaffRow(row, staffType) {
  const user = row?.user ?? {}
  const department = row?.department ?? null

  return {
    id: row.id,
    user_id: row.user_id ?? user.id ?? null,
    company_id: row.company_id ?? null,
    department_id: row.department_id ?? department?.id ?? null,
    education: row.education ?? '',
    job_title: row.job_title ?? '',
    base_salary: asNumber(row.base_salary),
    hire_date: row.hire_date ?? '',
    employment_type: row.employment_type ?? 'full-time',
    is_active: row.is_active ?? true,
    created_at: row.created_at ?? null,
    full_name: user.full_name ?? row.full_name ?? '',
    email: user.email ?? row.email ?? '',
    phone: user.phone ?? row.phone ?? '',
    role: user.role ?? row.role ?? (staffType === STAFF_TYPE.HR ? 'hr_manager' : 'employee'),
    status: user.status ?? null,
    gender: user.gender ?? row.gender ?? null,
    marital_status: user.marital_status ?? row.marital_status ?? null,
    nationality: user.nationality ?? row.nationality ?? null,
    residence: user.residence ?? row.residence ?? null,
    department_name: department?.name ?? '',
    department,
    user,
    document: row.document ?? null,
    staffType
  }
}

function buildPayload(form) {
  const payload = {
    full_name: form.full_name?.trim(),
    email: form.email?.trim(),
    department_id: form.department_id || null,
    job_title: form.job_title?.trim(),
    base_salary: Number(form.base_salary),
    hire_date: form.hire_date,
    is_active: Boolean(form.is_active)
  }

  if (form.phone) payload.phone = form.phone.trim()
  if (form.education) payload.education = form.education.trim()
  if (form.employment_type) payload.employment_type = form.employment_type
  if (form.gender) payload.gender = form.gender
  if (form.marital_status) payload.marital_status = form.marital_status
  if (form.nationality) payload.nationality = form.nationality.trim()
  if (form.residence) payload.residence = form.residence.trim()

  return payload
}

export const useStaffStore = defineStore('staff', () => {
  const authStore = useAuthStore()

  const staff = ref([])
  const departments = ref([])
  const selected = ref(null)

  const loading = ref(false)
  const detailLoading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const templateLoading = ref(false)
  const importing = ref(false)
  const importError = ref(null)
  const importRowErrors = ref(null)
  const importSuccess = ref(null)
  const error = ref(null)

  const companyId = computed(() => authStore.companyId)

  const sortedStaff = computed(() =>
    [...staff.value].sort((a, b) => String(b.hire_date || '').localeCompare(String(a.hire_date || '')))
  )

  async function fetchDepartments() {
    try {
      const result = await departmentsService.list({ is_active: true })
      departments.value = Array.isArray(result) ? result : []
      return departments.value
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * Load directory rows according to role:
   * - GM: employees + HR managers (Promise.all), merged with staffType
   * - HR: employees only (regular)
   */
  async function fetchDirectory() {
    loading.value = true
    error.value = null
    try {
      if (authStore.isGeneralManager) {
        if (!companyId.value) throw new Error('Company context is missing.')

        const [employees, hrManagers] = await Promise.all([
          employeesService.list(),
          hrManagersService.list(companyId.value)
        ])

        const regular = (employees || [])
          .filter((row) => (row?.user?.role ?? row?.role) !== 'hr_manager')
          .map((row) => normalizeStaffRow(row, STAFF_TYPE.REGULAR))

        const hrs = (hrManagers || []).map((row) => normalizeStaffRow(row, STAFF_TYPE.HR))

        // Prefer HR endpoint row when the same person appears in both lists.
        const byId = new Map()
        for (const row of regular) byId.set(row.id, row)
        for (const row of hrs) byId.set(row.id, row)
        staff.value = Array.from(byId.values())
      } else {
        const employees = await employeesService.list()
        staff.value = (employees || [])
          .filter((row) => (row?.user?.role ?? row?.role) !== 'hr_manager')
          .map((row) => normalizeStaffRow(row, STAFF_TYPE.REGULAR))
      }

      return staff.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(row) {
    if (!row?.id) return null
    detailLoading.value = true
    error.value = null
    try {
      let raw
      if (row.staffType === STAFF_TYPE.HR) {
        if (!companyId.value) throw new Error('Company context is missing.')
        raw = await hrManagersService.get(companyId.value, row.id)
        // Some APIs nest under hr_manager
        raw = raw?.hr_manager ?? raw
        selected.value = normalizeStaffRow(raw, STAFF_TYPE.HR)
      } else {
        raw = await employeesService.get(row.id)
        selected.value = normalizeStaffRow(raw, STAFF_TYPE.REGULAR)
      }
      return selected.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      detailLoading.value = false
    }
  }

  function canManage(row) {
    if (!row) return false
    if (authStore.isGeneralManager) return row.staffType === STAFF_TYPE.HR
    if (authStore.isHrManager) return row.staffType === STAFF_TYPE.REGULAR
    return false
  }

  async function createStaff(staffType, form) {
    saving.value = true
    error.value = null
    try {
      const payload = buildPayload(form)
      let result
      if (staffType === STAFF_TYPE.HR) {
        if (!companyId.value) throw new Error('Company context is missing.')
        result = await hrManagersService.create(companyId.value, payload)
      } else {
        result = await employeesService.create(payload)
      }
      await fetchDirectory()
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      saving.value = false
    }
  }

  async function updateStaff(row, form) {
    if (!row?.id) throw new Error('Staff record is required.')
    saving.value = true
    error.value = null
    try {
      const payload = buildPayload(form)
      let result
      if (row.staffType === STAFF_TYPE.HR) {
        if (!companyId.value) throw new Error('Company context is missing.')
        result = await hrManagersService.update(companyId.value, row.id, payload)
      } else {
        result = await employeesService.update(row.id, payload)
      }
      await fetchDirectory()
      if (selected.value?.id === row.id) {
        await fetchDetail({ ...row })
      }
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      saving.value = false
    }
  }

  /**
   * Attempt hard delete. On HTTP 409 the caller should offer freeze instead.
   * @returns {Promise<{ status: 'deleted'|'blocked', message?: string, error?: object }>}
   */
  async function deleteStaff(row) {
    if (!row?.id) throw new Error('Staff record is required.')
    deleting.value = true
    error.value = null
    try {
      if (row.staffType === STAFF_TYPE.HR) {
        if (!companyId.value) throw new Error('Company context is missing.')
        await hrManagersService.remove(companyId.value, row.id)
      } else {
        await employeesService.remove(row.id)
      }
      if (selected.value?.id === row.id) selected.value = null
      await fetchDirectory()
      return { status: 'deleted' }
    } catch (err) {
      if (err.status === 409) {
        // Backend may have already frozen the account; refresh so UI reflects that.
        try {
          await fetchDirectory()
          if (selected.value?.id === row.id) {
            await fetchDetail({ ...row })
          }
        } catch {
          // ignore refresh errors here
        }
        return {
          status: 'blocked',
          message:
            err.message ||
            'Permanent deletion is not available because this person has related records.',
          error: err
        }
      }
      error.value = err.message
      throw err
    } finally {
      deleting.value = false
    }
  }

  /** Freeze via full update (is_active: false). For HR also call deactivate when available. */
  async function freezeStaff(row) {
    if (!row?.id) throw new Error('Staff record is required.')
    saving.value = true
    error.value = null
    try {
      const form = {
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        department_id: row.department_id,
        education: row.education,
        job_title: row.job_title,
        base_salary: row.base_salary,
        hire_date: row.hire_date,
        employment_type: row.employment_type,
        is_active: false,
        gender: row.gender,
        marital_status: row.marital_status,
        nationality: row.nationality,
        residence: row.residence
      }

      if (row.staffType === STAFF_TYPE.HR) {
        if (!companyId.value) throw new Error('Company context is missing.')
        await hrManagersService.update(companyId.value, row.id, buildPayload(form))
        try {
          await hrManagersService.deactivate(companyId.value, row.id)
        } catch {
          // Deactivate is best-effort if update already set is_active=false.
        }
      } else {
        await employeesService.update(row.id, buildPayload(form))
      }

      await fetchDirectory()
      if (selected.value?.id === row.id) {
        await fetchDetail({ ...row })
      }
      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      saving.value = false
    }
  }

  /** Reactivate via full update (is_active: true). */
  async function activateStaff(row) {
    if (!row?.id) throw new Error('Staff record is required.')
    saving.value = true
    error.value = null
    try {
      const form = {
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        department_id: row.department_id,
        education: row.education,
        job_title: row.job_title,
        base_salary: row.base_salary,
        hire_date: row.hire_date,
        employment_type: row.employment_type,
        is_active: true,
        gender: row.gender,
        marital_status: row.marital_status,
        nationality: row.nationality,
        residence: row.residence
      }

      if (row.staffType === STAFF_TYPE.HR) {
        if (!companyId.value) throw new Error('Company context is missing.')
        await hrManagersService.update(companyId.value, row.id, buildPayload(form))
        try {
          await hrManagersService.activate(companyId.value, row.id)
        } catch {
          // Activate is best-effort.
        }
      } else {
        await employeesService.update(row.id, buildPayload(form))
      }

      await fetchDirectory()
      if (selected.value?.id === row.id) {
        await fetchDetail({ ...row })
      }
      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      saving.value = false
    }
  }

  function clearSelected() {
    selected.value = null
  }

  function clearImportFeedback() {
    importError.value = null
    importRowErrors.value = null
    importSuccess.value = null
  }

  async function downloadImportTemplate() {
    templateLoading.value = true
    clearImportFeedback()
    try {
      await employeesService.downloadImportTemplate()
    } catch (err) {
      importError.value = err.message
      throw err
    } finally {
      templateLoading.value = false
    }
  }

  /**
   * Bulk import employees from Excel/CSV (all-or-nothing on the server).
   * @param {File} file
   */
  async function importEmployees(file) {
    importing.value = true
    clearImportFeedback()
    try {
      const result = await employeesService.importFromFile(file)
      importSuccess.value = result
      await fetchDirectory()
      return result
    } catch (err) {
      importError.value = err.message
      importRowErrors.value = err.errors ?? null
      throw err
    } finally {
      importing.value = false
    }
  }

  return {
    staff,
    sortedStaff,
    departments,
    selected,
    loading,
    detailLoading,
    saving,
    deleting,
    templateLoading,
    importing,
    importError,
    importRowErrors,
    importSuccess,
    error,
    companyId,
    fetchDirectory,
    fetchDepartments,
    fetchDetail,
    canManage,
    createStaff,
    updateStaff,
    deleteStaff,
    freezeStaff,
    activateStaff,
    clearSelected,
    clearImportFeedback,
    downloadImportTemplate,
    importEmployees
  }
})

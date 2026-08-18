import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { departmentsService } from '@/services/departments.service'
import { t } from '@/i18n/helpers'

/**
 * Normalize a department API row for table/form display.
 * @param {object} row
 */
export function normalizeDepartment(row) {
  if (!row) return null

  const manager = row.manager ?? row.manager_employee ?? null
  const managerUser = manager?.user ?? null

  const managerName =
    managerUser?.full_name ||
    manager?.full_name ||
    row.manager_name ||
    null

  const managerId = row.manager_id ?? manager?.id ?? null

  return {
    id: row.id,
    name: row.name ?? '',
    is_active: row.is_active ?? true,
    manager_id: managerId,
    manager_name: managerName,
    manager,
    employees_count: row.employees_count ?? row.employees?.length ?? null,
    created_at: row.created_at ?? null,
    raw: row
  }
}

function employeeLabel(row) {
  const user = row?.user ?? {}
  const name = user.full_name ?? row.full_name ?? t('common.notSpecified')
  const title = row.job_title ? ` — ${row.job_title}` : ''
  return `${name}${title}`
}

export const useDepartmentsStore = defineStore('departments', () => {
  const departments = ref([])
  const currentDepartment = ref(null)
  const departmentEmployees = ref([])

  const loading = ref(false)
  const employeesLoading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const error = ref(null)

  const sortedDepartments = computed(() =>
    [...departments.value].sort((a, b) => String(a.name).localeCompare(String(b.name)))
  )

  const employeeOptions = computed(() =>
    departmentEmployees.value
      .filter((row) => row.is_active !== false)
      .map((row) => ({
        value: row.id,
        label: employeeLabel(row)
      }))
  )

  async function fetchDepartments(params = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await departmentsService.list(params)
      departments.value = (Array.isArray(data) ? data : []).map(normalizeDepartment)
      return departments.value
    } catch (err) {
      error.value = err.message || t('staff.loadDepartmentsFailed')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDepartmentById(id) {
    loading.value = true
    error.value = null
    try {
      const data = await departmentsService.get(id)
      currentDepartment.value = normalizeDepartment(data)
      return currentDepartment.value
    } catch (err) {
      error.value = err.message || t('staff.loadDepartmentDetailsFailed')
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Load active employees belonging to a department (for manager picker on edit).
   */
  async function fetchDepartmentEmployees(departmentId) {
    if (!departmentId) {
      departmentEmployees.value = []
      return []
    }

    employeesLoading.value = true
    error.value = null
    try {
      const data = await departmentsService.listEmployees(departmentId, {
        is_active: true,
        per_page: 100
      })
      departmentEmployees.value = Array.isArray(data) ? data : []
      return departmentEmployees.value
    } catch (err) {
      error.value = err.message || t('staff.loadDepartmentEmployeesFailed')
      departmentEmployees.value = []
      throw err
    } finally {
      employeesLoading.value = false
    }
  }

  async function createDepartment(form) {
    saving.value = true
    error.value = null
    try {
      const payload = {
        name: form.name.trim(),
        is_active: Boolean(form.is_active)
      }
      // Create without manager — assign later after employees exist in the department.
      const created = await departmentsService.create(payload)
      await fetchDepartments()
      return normalizeDepartment(created)
    } catch (err) {
      error.value = err.message || t('staff.createDepartmentFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  async function updateDepartment(id, form) {
    saving.value = true
    error.value = null
    try {
      const payload = {
        name: form.name.trim(),
        is_active: Boolean(form.is_active)
      }

      if (form.manager_id) {
        payload.manager_id = form.manager_id
      } else {
        payload.manager_id = null
      }

      const updated = await departmentsService.update(id, payload)
      await fetchDepartments()
      if (currentDepartment.value?.id === id) {
        currentDepartment.value = normalizeDepartment(updated ?? { ...currentDepartment.value, ...payload })
      }
      return normalizeDepartment(updated)
    } catch (err) {
      error.value = err.message || t('staff.updateDepartmentFailed')
      throw err
    } finally {
      saving.value = false
    }
  }

  /**
   * @returns {Promise<{ status: 'deleted'|'blocked', message?: string }>}
   */
  async function deleteDepartment(id) {
    deleting.value = true
    error.value = null
    try {
      await departmentsService.remove(id)
      departments.value = departments.value.filter((dept) => dept.id !== id)
      if (currentDepartment.value?.id === id) currentDepartment.value = null
      return { status: 'deleted' }
    } catch (err) {
      if (err.status === 409) {
        return {
          status: 'blocked',
          message:
            err.message ||
            t('staff.mustBeEmpty')
        }
      }
      error.value = err.message || t('staff.deleteDepartmentFailed')
      throw err
    } finally {
      deleting.value = false
    }
  }

  function clearDepartmentEmployees() {
    departmentEmployees.value = []
  }

  return {
    departments,
    sortedDepartments,
    currentDepartment,
    departmentEmployees,
    employeeOptions,
    loading,
    employeesLoading,
    saving,
    deleting,
    error,
    fetchDepartments,
    fetchDepartmentById,
    fetchDepartmentEmployees,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    clearDepartmentEmployees
  }
})

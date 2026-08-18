import { defineStore } from 'pinia'
import { ref } from 'vue'
import { hrManagersService } from '@/services/hrManagers.service'
import { departmentsService } from '@/services/departments.service'
import { t } from '@/i18n/helpers'

/** HR department is not taken from the API — always shown as this label. */
export const HR_DEPARTMENT_NAME = () => t('staff.humanResources')

/**
 * HR list/detail payloads keep identity fields at the top level and nest
 * employment fields (job_title, base_salary, hire_date, …) under `employee`.
 */
export function unwrapHrManagerPayload(row) {
  if (!row || typeof row !== 'object') return row

  const employee = row.employee && typeof row.employee === 'object' ? row.employee : null

  return {
    ...row,
    employee_id: employee?.id ?? row.employee_id ?? null,
    department_id: employee?.department_id ?? row.department_id ?? null,
    education: employee?.education ?? row.education ?? null,
    job_title: employee?.job_title ?? row.job_title ?? null,
    base_salary: employee?.base_salary ?? row.base_salary ?? null,
    hire_date: employee?.hire_date ?? row.hire_date ?? null,
    birth_date: employee?.birth_date ?? row.birth_date ?? null,
    employment_type: employee?.employment_type ?? row.employment_type ?? null,
    is_active: employee?.is_active ?? row.is_active ?? row.status === 'active',
    department_name: HR_DEPARTMENT_NAME()
  }
}

/**
 * Store خاص بميزة "إدارة الكادر والمسؤولين" — تبويب إضافة مدير HR حاليًا.
 * سيُستخدم لاحقًا أيضًا لتبويبي "الدليل" و"الاستيراد الجماعي" عند بناء
 * منطقهما الفعلي (المخطط لهما حاليًا كتبويبات فارغة placeholder في الواجهة).
 */
export const useHrManagersStore = defineStore('hrManagers', () => {
  // حالة قائمة الأقسام (لتغذية حقل اختيار القسم في نموذج الإضافة)
  const departments = ref([])
  const departmentsLoading = ref(false)

  // حالة عملية إنشاء مدير HR جديد
  const creating = ref(false)

  // خطأ عام مشترك للـ Store (تُعرضه المكوّنات المستدعية عبر BaseAlert)
  const error = ref(null)

  /**
   * جلب أقسام الشركة الحالية (النشطة فقط افتراضيًا) لتعبئة قائمة الاختيار.
   */
  async function fetchDepartments() {
    departmentsLoading.value = true
    error.value = null
    try {
      const result = await departmentsService.list({ is_active: true })
      departments.value = Array.isArray(result) ? result : []
      console.log('[HrManagers] Fetch departments succeeded:', result)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[HrManagers] Fetch departments failed:', err)
      throw err
    } finally {
      departmentsLoading.value = false
    }
  }

  /**
   * إنشاء مدير موارد بشرية جديد تابع للشركة الحالية.
   * @param {string} companyId
   * @param {object} payload
   */
  async function createHrManager(companyId, payload) {
    creating.value = true
    error.value = null
    try {
      const result = await hrManagersService.create(companyId, payload)
      console.log('[HrManagers] Create HR manager succeeded:', result)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[HrManagers] Create HR manager failed:', err)
      throw err
    } finally {
      creating.value = false
    }
  }

  return {
    departments,
    departmentsLoading,
    creating,
    error,
    fetchDepartments,
    createHrManager
  }
})

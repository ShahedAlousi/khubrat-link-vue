import { defineStore } from 'pinia'
import { ref } from 'vue'
import { hrManagersService } from '@/services/hrManagers.service'
import { departmentsService } from '@/services/departments.service'

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

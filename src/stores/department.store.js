import { defineStore } from 'pinia'
import { ref } from 'vue'
import { departmentsService } from '@/services/departments.service'

export const useDepartmentsStore = defineStore('departments', () => {
  // ==========================================
  // State (الحالة)
  // ==========================================
  const departments = ref([])
  const currentDepartment = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // ==========================================
  // Actions (الإجراءات)
  // ==========================================

  /**
   * جلب قائمة الأقسام
   */
  const fetchDepartments = async (params = {}) => {
    isLoading.value = true
    error.value = null
    try {
      const data = await departmentsService.list(params)
      departments.value = data
      return data
    } catch (err) {
      error.value = err.response?.data?.message || 'حدث خطأ أثناء جلب الأقسام'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * جلب تفاصيل قسم محدد
   */
  const fetchDepartmentById = async (id) => {
    isLoading.value = true
    error.value = null
    try {
      const data = await departmentsService.get(id)
      currentDepartment.value = data
      return data
    } catch (err) {
      error.value = err.response?.data?.message || 'حدث خطأ أثناء جلب تفاصيل القسم'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * إضافة قسم جديد
   */
  const createDepartment = async (payload) => {
    isLoading.value = true
    error.value = null
    try {
      const newDepartment = await departmentsService.create(payload)
      // تحديث القائمة محلياً لتجنب طلب جديد من السيرفر (اختياري)
      departments.value.push(newDepartment)
      return newDepartment
    } catch (err) {
      error.value = err.response?.data?.message || 'حدث خطأ أثناء إضافة القسم'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * تعديل قسم موجود
   */
  const updateDepartment = async (id, payload) => {
    isLoading.value = true
    error.value = null
    try {
      const updatedDepartment = await departmentsService.update(id, payload)
      // تحديث القسم المعدل في القائمة المحلية
      const index = departments.value.findIndex((dept) => dept.id === id)
      if (index !== -1) {
        // دمج البيانات القديمة مع الجديدة
        departments.value[index] = { ...departments.value[index], ...payload, ...updatedDepartment }
      }
      if (currentDepartment.value?.id === id) {
        currentDepartment.value = { ...currentDepartment.value, ...payload, ...updatedDepartment }
      }
      return updatedDepartment
    } catch (err) {
      error.value = err.response?.data?.message || 'حدث خطأ أثناء تعديل القسم'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * حذف قسم
   */
  const deleteDepartment = async (id) => {
    isLoading.value = true
    error.value = null
    try {
      await departmentsService.delete(id)
      // إزالة القسم من القائمة المحلية بعد نجاح الحذف
      departments.value = departments.value.filter((dept) => dept.id !== id)
      if (currentDepartment.value?.id === id) {
        currentDepartment.value = null
      }
      return true
    } catch (err) {
      // معالجة حالة الخطأ 409 (القسم يحتوي على موظفين)
      if (err.response?.status === 409) {
        error.value = 'لا يمكن حذف القسم لوجود موظفين مرتبطين به.'
      } else {
        error.value = err.response?.data?.message || 'حدث خطأ أثناء حذف القسم'
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }

 
  return {
    // State
    departments,
    currentDepartment,
    isLoading,
    error,
    
    // Actions
    fetchDepartments,
    fetchDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment
  }
})
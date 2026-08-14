import { ref } from 'vue'
import { defineStore } from 'pinia'
import { companiesService } from '@/services/companies.service'

export const useCompaniesStore = defineStore('companies', () => {
  const companies = ref([])
  const currentCompany = ref(null)
  const stats = ref(null)

  const loading = ref(false)
  const statsLoading = ref(false)
  const error = ref(null)

  async function fetchCompanies() {
    loading.value = true
    error.value = null
    try {
      const data = await companiesService.list()
      companies.value = Array.isArray(data) ? data : []
      return companies.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCompany(companyId) {
    loading.value = true
    error.value = null
    try {
      currentCompany.value = await companiesService.get(companyId)
      return currentCompany.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    statsLoading.value = true
    error.value = null
    try {
      stats.value = await companiesService.stats()
      return stats.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      statsLoading.value = false
    }
  }

  async function registerCompany(payload) {
    loading.value = true
    error.value = null
    try {
      const response = await companiesService.register(payload)
      
      // التحقق مما إذا كانت الباقة مدفوعة وتتطلب تحويلاً لبوابة الدفع
      if (response.payment_required && response.payment_url) {
        // فتح الرابط في تبويب جديد
        window.open(response.payment_url, '_blank')
      }

      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function patchLocalStatus(companyId, statusValue) {
    const isActive = statusValue === 'active'
  
    // 1. تحديث العنصر في القائمة (والذي يستقبل is_active)
    const index = companies.value.findIndex((c) => c.id === companyId)
    if (index !== -1) {
      companies.value[index] = {
        ...companies.value[index],
        is_active: isActive,
        status: statusValue // كحقل احتياطي
      }
    }
  
    // 2. تحديث تفاصيل الشركة الحالية (والتي تستقبل status)
    if (currentCompany.value?.id === companyId) {
      currentCompany.value = {
        ...currentCompany.value,
        is_active: isActive,
        status: statusValue
      }
    }
  }
  
  async function freezeCompany(companyId, reason) {
    error.value = null
    try {
      await companiesService.freeze(companyId, reason)
      patchLocalStatus(companyId, 'frozen')
    } catch (err) {
      error.value = err.message
      throw err
    }
  }
  
  async function activateCompany(companyId) {
    error.value = null
    try {
      await companiesService.activate(companyId)
      patchLocalStatus(companyId, 'active')
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function removeCompany(companyId) {
    error.value = null
    try {
      await companiesService.remove(companyId)
      companies.value = companies.value.filter((c) => c.id !== companyId)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  return {
    companies,
    currentCompany,
    stats,
    loading,
    statsLoading,
    error,
    fetchCompanies,
    fetchCompany,
    fetchStats,
    registerCompany,
    freezeCompany,
    activateCompany,
    removeCompany
  }
})

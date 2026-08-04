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
      return await companiesService.register(payload)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function patchLocalStatus(companyId, patch) {
    const index = companies.value.findIndex((c) => c.id === companyId)
    if (index !== -1) companies.value[index] = { ...companies.value[index], ...patch }
    if (currentCompany.value?.id === companyId) {
      currentCompany.value = { ...currentCompany.value, ...patch }
    }
  }

  async function freezeCompany(companyId, reason) {
    error.value = null
    try {
      await companiesService.freeze(companyId, reason)
      patchLocalStatus(companyId, { status: 'frozen' })
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function activateCompany(companyId) {
    error.value = null
    try {
      await companiesService.activate(companyId)
      patchLocalStatus(companyId, { status: 'active' })
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

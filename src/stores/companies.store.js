import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { companiesService } from '@/services/companies.service'
import { useAuthStore } from '@/stores/auth.store'
import { resolveCheckout } from '@/utils/checkout'

// عدد الأيام المتبقية التي يبدأ عندها تحذير التجديد بالظهور للمستخدم
const RENEWAL_WARNING_DAYS = 5

/** أي حالة نصية غير "active" تعني أن الشركة غير فعّالة (frozen / suspended / inactive …) */
function isInactiveStatus(status) {
  if (typeof status !== 'string' || !status.trim()) return false
  return status.trim().toLowerCase() !== 'active'
}

export const useCompaniesStore = defineStore('companies', () => {
  const companies = ref([])
  const currentCompany = ref(null)
  const stats = ref(null)

  const loading = ref(false)
  const statsLoading = ref(false)
  const error = ref(null)

  // ---- اشتراك الشركة الحالية (لوحة الشركة، وليس لوحة المنصة) ----
  const subscriptionUsage = ref(null)
  const usageLoading = ref(false)
  const renewing = ref(false)

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
      // لا نفتح بوابة الدفع هنا — الصفحة تستدعي redirect بنفس التبويب بعد حفظ session_id
      return await companiesService.register(payload)
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

  /** الأيام المتبقية من مدة الاشتراك (null إن كانت الباقة بلا مدة محددة) */
  const daysRemaining = computed(() => {
    const value = subscriptionUsage.value?.period?.days_remaining
    return typeof value === 'number' ? value : null
  })

  const isSubscriptionExpired = computed(() =>
    Boolean(subscriptionUsage.value?.period?.is_expired)
  )

  /**
   * الشركة غير فعّالة (مجمّدة من المنصة أو موقوفة لانتهاء الاشتراك).
   * نعتمد company_status القادم من /usage، ونرجع لبيانات الشركة المخزّنة عند
   * تسجيل الدخول كخطة بديلة لأن endpoint الاستهلاك قد يُحجب للشركة المجمّدة.
   */
  const isCompanyFrozen = computed(() => {
    if (isInactiveStatus(subscriptionUsage.value?.company_status)) return true
  
    const company = useAuthStore().company
    if (!company) return false
    if (company.is_active === false) return true
    return isInactiveStatus(company.status ?? company.company_status)
  })

  /** يظهر زر التجديد البارز عند التجميد أو انتهاء الاشتراك أو تبقّي 5 أيام أو أقل */
  const needsRenewal = computed(() => {
    if (isCompanyFrozen.value || isSubscriptionExpired.value) return true
    return daysRemaining.value !== null && daysRemaining.value <= RENEWAL_WARNING_DAYS
  })

  async function fetchSubscriptionUsage() {
    usageLoading.value = true
    error.value = null
    try {
      subscriptionUsage.value = await companiesService.subscriptionUsage()
      return subscriptionUsage.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      usageLoading.value = false
    }
  }

  /**
   * تجديد اشتراك الشركة بباقة مختارة.
   * @returns {Promise<{paymentUrl: string|null, sessionId: string|null, response: object}>}
   * paymentUrl يكون null للباقات المجانية (الباك اند يرسل بريداً بدل جلسة الدفع).
   */
  async function renewSubscription(planId) {
    renewing.value = true
    error.value = null
    try {
      const response = await companiesService.renewSubscription(planId)
      const checkout = resolveCheckout(response)
      return {
        paymentUrl: checkout.paymentUrl,
        sessionId: checkout.sessionId,
        response
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      renewing.value = false
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
    subscriptionUsage,
    usageLoading,
    renewing,
    daysRemaining,
    isSubscriptionExpired,
    isCompanyFrozen,
    needsRenewal,
    fetchCompanies,
    fetchCompany,
    fetchStats,
    registerCompany,
    freezeCompany,
    activateCompany,
    removeCompany,
    fetchSubscriptionUsage,
    renewSubscription
  }
})

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/services/auth.service'
import { tokenStorage, clearApiAuth } from '@/services/api'
import router from '@/router'

const USER_KEY = 'khubrat_user'
const COMPANY_KEY = 'khubrat_company'
const TOKEN_KEY = 'khubrat_token'

function needsPasswordReset(user) {
  if (!user) return false
  return Boolean(
    user.must_change_password ?? user.force_password_change ?? user.is_first_login ?? false
  )
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const company = ref(null)
  const token = ref(null)
  const loading = ref(false)
  const loggingOut = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => Boolean(token.value))
  const mustChangePassword = computed(() => needsPasswordReset(user.value))

  // تحديد الأدوار بشكل صريح بناءً على enum الباك اند
  const userRole = computed(() => user.value?.role ?? null)
  
  // السوبر آدمن الخاص بالمنصة
  const isPlatformAdmin = computed(() => userRole.value === 'super_admin')

  // أدوار لوحة الشركة على الويب (الموظف العادي لا يدخل هذه اللوحة)
  const isCompanyUser = computed(() => {
    return ['general_manager', 'hr_manager', 'department_manager'].includes(userRole.value)
  })

  const isEmployee = computed(() => userRole.value === 'employee')

  // صلاحيات مخصصة داخل لوحة الشركة بناءً على طلبك
  const isGeneralManager = computed(() => userRole.value === 'general_manager')
  const isHrManager = computed(() => userRole.value === 'hr_manager')
  const isDepartmentManager = computed(() => userRole.value === 'department_manager')
  // Alias for hr_manager role checks across the UI
  const isHr = computed(() => isHrManager.value)
  function hasRole(role) {
    return userRole.value === role
  }

  // من يُسمح له بفتح واجهات المنصة/الشركة (غير صفحات المصادقة)
  const hasWebConsoleAccess = computed(() => {
    return isAuthenticated.value && !isEmployee.value && (isPlatformAdmin.value || isCompanyUser.value)
  })

  // مدير القسم يرى الطلبات وإدارة الموظفين فقط (موظفو قسمه لاحقاً)
  // بالإضافة لصفحة الإعدادات لأنها شخصية (مظهر الواجهة والدعم الفني)
  const DEPARTMENT_MANAGER_ROUTES = ['company-requests', 'company-staff-management', 'company-settings']

  // Policy configuration: GM can edit; HR can view only (read-only UI).
  const canViewPolicies = computed(() => {
    return userRole.value === 'general_manager' || userRole.value === 'hr_manager'
  })

  // Policy configuration is restricted to the general manager only
  const canManagePolicies = computed(() => userRole.value === 'general_manager')

  // المدير العام يرى الإحصائيات فقط ولا يرى تفاصيل الطلبات
  const canViewRequestDetails = computed(() => {
    return userRole.value !== 'general_manager'
  })

  function canAccessCompanyRoute(routeName) {
    if (!isDepartmentManager.value) return true
    return DEPARTMENT_MANAGER_ROUTES.includes(routeName)
  }

  const companyId = computed(() => company.value?.id ?? null)

  function persistSession() {
    if (token.value) tokenStorage.set(token.value)
    if (user.value) localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    if (company.value) localStorage.setItem(COMPANY_KEY, JSON.stringify(company.value))
  }

  function clearSession() {
    user.value = null
    company.value = null
    token.value = null
    tokenStorage.clear()
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(COMPANY_KEY)
    sessionStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(COMPANY_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    clearApiAuth()
  }

  function restoreSession() {
    const storedToken = tokenStorage.get()
    if (!storedToken) return

    token.value = storedToken
    try {
      user.value = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
      company.value = JSON.parse(localStorage.getItem(COMPANY_KEY) || 'null')
    } catch {
      user.value = null
      company.value = null
    }
  }

  async function login(credentials) {
    loading.value = true
    error.value = null
    try {
      const data = await authService.login(credentials)
      user.value = data.user
      company.value = data.company
      token.value = data.token
      persistSession()
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    if (loggingOut.value) return

    loggingOut.value = true
    try {
      await authService.logout()
    } catch {
      // Always clear local session even when the API call fails (e.g. expired token).
    } finally {
      clearSession()
      loggingOut.value = false
      router.push({ name: 'login' })
    }
  }

  async function forgotPassword(email) {
    loading.value = true
    error.value = null
    try {
      return await authService.forgotPassword(email)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(payload) {
    loading.value = true
    error.value = null
    try {
      return await authService.resetPassword(payload)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function completeFirstLogin(payload) {
    loading.value = true
    error.value = null
    try {
      const result = await authService.completeFirstLogin(payload)
      if (user.value) {
        user.value = { ...user.value, must_change_password: false, force_password_change: false, is_first_login: false }
        persistSession()
      }
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    company,
    token,
    loading,
    loggingOut,
    error,
    userRole,
    isAuthenticated,
    mustChangePassword,
    isCompanyUser,
    isEmployee,
    isPlatformAdmin,
    isGeneralManager,
    isHrManager,
    isDepartmentManager,
    isHr,
    hasRole,
    hasWebConsoleAccess,
    canManagePolicies,
    canViewPolicies,
    canViewRequestDetails,
    canAccessCompanyRoute,
    companyId,
    restoreSession,
    login,
    logout,
    forgotPassword,
    resetPassword,
    completeFirstLogin
  }
})
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const AdminLayout = () => import('@/components/layout/AdminLayout.vue')
const CompanyLayout = () => import('@/components/layout/CompanyLayout.vue')

/** Default landing route for authenticated company (tenant) users. */
function companyHomeRoute(authStore) {
  if (authStore.isDepartmentManager) {
    return { name: 'company-requests' }
  }
  return authStore.canManagePolicies
    ? { name: 'company-policies' }
    : { name: 'company-dashboard' }
}

function defaultHomeRoute(authStore) {
  if (authStore.isCompanyUser) return companyHomeRoute(authStore)
  if (authStore.isPlatformAdmin) return { name: 'dashboard-overview' }
  return { name: 'forbidden' }
}

function isAuthOrPublicSurface(to) {
  if (to.meta.guestOnly || to.meta.publicAccess) return true
  return to.matched.some((record) => record.meta.guestOnly || record.meta.publicAccess)
}

const routes = [
  {
    path: '/',
    redirect: () => {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return { name: 'login' }
      return defaultHomeRoute(authStore)
    }
  },

  // ---- Public: authentication ----
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/complete-first-login',
    name: 'complete-first-login',
    component: () => import('@/views/auth/CompleteFirstLoginView.vue'),
    meta: { requiresAuth: true, publicAccess: true }
  },

  // ---- Public: onboarding / self-service signup ----
  {
    path: '/signup',
    name: 'signup-workspace',
    component: () => import('@/views/onboarding/CreateWorkspaceView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/signup/plan',
    name: 'signup-plan',
    component: () => import('@/views/onboarding/PlanSelectionView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/signup/admin-account',
    name: 'signup-admin',
    component: () => import('@/views/onboarding/SetupAdminAccountView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/signup/success',
    name: 'signup-success',
    component: () => import('@/views/onboarding/VerificationSuccessView.vue'),
    meta: { guestOnly: true }
  },
  // ---- Public: Payment Callbacks (Stripe success_url / cancel_url) ----
  {
    path: '/payment/success',
    name: 'payment-success',
    component: () => import('@/views/onboarding/PaymentSuccessView.vue'),
    meta: { publicAccess: true }
  },
  {
    path: '/payment/cancel',
    name: 'payment-cancel',
    component: () => import('@/views/onboarding/PaymentCancelView.vue'),
    meta: { publicAccess: true }
  },

  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/views/ForbiddenView.vue'),
    meta: { publicAccess: true }
  },

  // ---- Protected: PLATFORM admin dashboard (Super Admin) ----
  {
    path: '/dashboard',
    component: AdminLayout,
    meta: { requiresAuth: true, persona: 'platform-admin' },
    children: [
      {
        path: '',
        name: 'dashboard-overview',
        component: () => import('@/views/dashboard/DashboardOverviewView.vue'),
        meta: { titleKey: 'nav.admin.overview' }
      },
      {
        path: 'packages',
        name: 'dashboard-packages',
        component: () => import('@/views/dashboard/PackagesView.vue'),
        meta: { titleKey: 'nav.admin.packages' }
      },
      {
        path: 'companies',
        name: 'dashboard-companies',
        component: () => import('@/views/dashboard/CompaniesListView.vue'),
        meta: { titleKey: 'nav.admin.companies' }
      },
      {
        path: 'settings',
        name: 'dashboard-settings',
        component: () => import('@/views/dashboard/SettingsView.vue'),
        meta: { titleKey: 'nav.admin.settings' }
      }
    ]
  },

  // ---- Protected: TENANT company console (General Manager, HR, etc.) ----
  {
    path: '/company',
    component: CompanyLayout,
    meta: { requiresAuth: true, persona: 'company-user' },
    children: [
      {
        path: '',
        redirect: () => {
          const authStore = useAuthStore()
          if (!authStore.hasWebConsoleAccess || !authStore.isCompanyUser) {
            return { name: 'forbidden' }
          }
          return companyHomeRoute(authStore)
        }
      },
      {
        path: 'dashboard',
        name: 'company-dashboard',
        component: () => import('@/views/company/CompanyDashboardView.vue'),
        meta: { titleKey: 'nav.company.dashboard', denyDepartmentManager: true }
      },
      {
        path: 'profile',
        name: 'company-profile',
        component: () => import('@/views/company/CompanyProfileView.vue'),
        meta: { titleKey: 'nav.company.profile', requiresGeneralManager: true }
      },
      {
        path: 'policies',
        name: 'company-policies',
        component: () => import('@/views/company/PolicyConfigurationView.vue'),
        meta: { titleKey: 'nav.company.policyFull', requiresPolicyViewer: true }
      },
      {
        path: 'requests',
        name: 'company-requests',
        component: () => import('@/views/company/RequestsManagementView.vue'),
        meta: { titleKey: 'nav.company.requests', requiresRequestViewer: true }
      },
      {
        path: 'staff',
        name: 'company-staff-management',
        component: () => import('@/views/company/StaffManagementView.vue'),
        meta: { titleKey: 'nav.company.staff' }
      },
      {
        path: 'evaluations',
        name: 'company-evaluations',
        component: () => import('@/views/company/EvaluationHubView.vue'),
        meta: { titleKey: 'nav.company.evaluationsHub', requiresHr: true }
      },
      {
        path: 'attendance',
        name: 'company-attendance',
        component: () => import('@/views/company/AttendanceTrackerView.vue'),
        meta: { titleKey: 'nav.company.attendanceTracker', denyDepartmentManager: true }
      },
      {
        path: 'payroll',
        name: 'company-payroll',
        component: () => import('@/views/company/PayrollManagementView.vue'),
        meta: { titleKey: 'nav.company.payrollManagement', denyDepartmentManager: true }
      },
      {
        path: 'settings',
        name: 'company-settings',
        component: () => import('@/views/company/CompanySettingsView.vue'),
        meta: { titleKey: 'nav.company.settings' }
      },
      {
        path: 'subscription/renew',
        name: 'company-subscription-renew',
        component: () => import('@/views/company/RenewSubscriptionView.vue'),
        meta: { titleKey: 'nav.company.renew', requiresGeneralManager: true }
      }
    ]
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { publicAccess: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const onAuthOrPublicSurface = isAuthOrPublicSurface(to)

  // 1. Auth / public surfaces stay reachable; guests bounce away from guestOnly when logged in
  if (onAuthOrPublicSurface) {
    if (to.name === 'complete-first-login' && !authStore.isAuthenticated) {
      return { name: 'forbidden' }
    }

    if (to.meta.guestOnly && authStore.isAuthenticated) {
      if (!authStore.hasWebConsoleAccess) return { name: 'forbidden' }
      return defaultHomeRoute(authStore)
    }

    return true
  }

  // 2. Everything else: must be logged in with a console-eligible role (blocks guests + employee)
  if (!authStore.hasWebConsoleAccess) {
    return { name: 'forbidden' }
  }

  // 3. Force password reset on initial login cycles
  if (authStore.mustChangePassword && to.name !== 'complete-first-login') {
    return { name: 'complete-first-login' }
  }

  // 4. Platform Superadmin vs Tenant console split protection
  if (to.meta.persona === 'platform-admin' && !authStore.isPlatformAdmin) {
    return { name: 'forbidden' }
  }
  if (to.meta.persona === 'company-user' && !authStore.isCompanyUser) {
    return { name: 'forbidden' }
  }

  // 5. Fine grained route guards → forbidden when role lacks permission
  if (to.meta.denyDepartmentManager && authStore.isDepartmentManager) {
    return { name: 'forbidden' }
  }

  if (to.name && authStore.isCompanyUser && !authStore.canAccessCompanyRoute(to.name)) {
    return { name: 'forbidden' }
  }

  if (to.meta.requiresPolicyViewer && !authStore.canViewPolicies) {
    return { name: 'forbidden' }
  }

  if (to.meta.requiresRequestViewer && !authStore.canViewRequestDetails) {
    return { name: 'forbidden' }
  }

  if (to.meta.requiresGeneralManager && !authStore.isGeneralManager) {
    return { name: 'forbidden' }
  }

  if (to.meta.requiresHr && !authStore.isHr) {
    return { name: 'forbidden' }
  }

  return true
})

export default router

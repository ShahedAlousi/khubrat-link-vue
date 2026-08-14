import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const AdminLayout = () => import('@/components/layout/AdminLayout.vue')
const CompanyLayout = () => import('@/components/layout/CompanyLayout.vue')

/** Default landing route for authenticated company (tenant) users. */
function companyHomeRoute(authStore) {
  return authStore.canManagePolicies
    ? { name: 'company-policies' }
    : { name: 'company-dashboard' }
}

const routes = [
  {
    path: '/',
    redirect: () => {
      const authStore = useAuthStore()
      if (authStore.isCompanyUser) return companyHomeRoute(authStore)
      return { name: 'dashboard-overview' }
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
    meta: { requiresAuth: true }
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
  // ---- Public: Payment Callbacks ----
  {
    path: '/payment/success',
    name: 'payment-success',
    component: () => import('@/views/onboarding/SetupAdminAccountView.vue'),
    meta: { guestOnly: true } // أو بدون meta حسب ما تفضلين
  },
  {
    path: '/payment/cancel',
    name: 'payment-cancel',
    component: () => import('@/views/onboarding/SetupAdminAccountView.vue'),
    meta: { guestOnly: true }
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
        meta: { title: 'Overview Dashboard' }
      },
      {
        path: 'packages',
        name: 'dashboard-packages',
        component: () => import('@/views/dashboard/PackagesView.vue'),
        meta: { title: 'HR Packages Plan' }
      },
      {
        path: 'companies',
        name: 'dashboard-companies',
        component: () => import('@/views/dashboard/CompaniesListView.vue'),
        meta: { title: 'Subscribed Companies' }
      },
      {
        path: 'settings',
        name: 'dashboard-settings',
        component: () => import('@/views/dashboard/SettingsView.vue'),
        meta: { title: 'Platform Settings' }
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
        redirect: () => companyHomeRoute(useAuthStore())
      },
      {
        path: 'dashboard',
        name: 'company-dashboard',
        component: () => import('@/views/company/CompanyDashboardView.vue'),
        meta: { title: 'Dashboard' }
      },
      {
        path: 'profile',
        name: 'company-profile',
        component: () => import('@/views/company/CompanyProfileView.vue'),
        meta: { title: 'Company Profile', requiresGeneralManager: true }
      },
      {
        path: 'policies',
        name: 'company-policies',
        component: () => import('@/views/company/PolicyConfigurationView.vue'),
        meta: { title: 'Company Policy Configuration', requiresPolicyManager: true }
      },
      {
        path: 'requests',
        name: 'company-requests',
        component: () => import('@/views/company/RequestsManagementView.vue'),
        meta: { title: 'Requests', requiresRequestViewer: true }
      },
      { path: 'staff',
        name: 'company-staff-management',
        component: () => import('@/views/company/StaffManagementView.vue'),
        meta: { requiresAuth: true, persona: 'company-user', title: 'Staff Management' } 
      },
        {
          path: 'evaluations',
          name: 'company-evaluations',
          component: () => import('@/views/company/EvaluationHubView.vue'),
          meta: { title: 'Evaluations Hub', requiresHr: true } 
        },
      {
        path: 'attendance',
        name: 'company-attendance',
        component: () => import('@/views/company/AttendanceTrackerView.vue'),
        meta: { title: 'AattendanceTracker' }
      },
      {
        path: 'payroll',
        name: 'company-payroll',
        component: () => import('@/views/company/PayrollManagementView.vue'),
        meta: { title: 'Payroll Management' }
      }
    
    ]
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  // 1. General login session protection
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 2. Redirect guests that are already authenticated
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return authStore.isCompanyUser ? companyHomeRoute(authStore) : { name: 'dashboard-overview' }
  }

  // 3. Force password reset on initial login cycles
  if (
    authStore.isAuthenticated &&
    authStore.mustChangePassword &&
    to.name !== 'complete-first-login'
  ) {
    return { name: 'complete-first-login' }
  }

  // 4. Platform Superadmin vs Tenant console split protection
  if (to.meta.persona === 'platform-admin' && !authStore.isPlatformAdmin) {
    return companyHomeRoute(authStore)
  }
  if (to.meta.persona === 'company-user' && !authStore.isCompanyUser) {
    return { name: 'dashboard-overview' }
  }

  // 5. Fine grained route guards
  if (to.meta.requiresPolicyManager && !authStore.canManagePolicies) {
    return { name: 'company-dashboard' }
  }

  if (to.meta.requiresRequestViewer && !authStore.canViewRequestDetails) {
    return { name: 'company-dashboard' }
  }

  if (to.meta.requiresGeneralManager && !authStore.isGeneralManager) {
    return { name: 'company-dashboard' }
  }

  if (to.meta.requiresHr && !authStore.isHr) {
    return { name: 'company-dashboard' }
  }

  return true
})

export default router
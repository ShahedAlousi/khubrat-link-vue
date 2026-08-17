<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import RequestDetailsDrawer from '@/components/requests/RequestDetailsDrawer.vue'
import LeaveRejectionModal from '@/components/requests/LeaveRejectionModal.vue'
import { useManagementRequestsStore } from '@/stores/managementRequests.store'
import { formatCurrency, formatDate, initials } from '@/utils/format'

const store = useManagementRequestsStore()

const activeTab = ref('pending')
const typeFilter = ref('all')
const viewStyle = ref('list')
const rejectionModalOpen = ref(false)
const rejectionTarget = ref(null)
const toast = ref(null)

const REQUEST_TYPES = [
  { value: 'all', label: 'All Request Types' },
  { value: 'leave', label: 'Leaves' },
  { value: 'advance', label: 'Advances' },
  { value: 'overtime', label: 'Overtime' },
  { value: 'permission', label: 'Permissions' }
]

const upcomingTypes = ['permission']

const TYPE_STYLES = {
  leave: {
    label: 'Leave',
    icon: 'fa-plane-departure',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  advance: {
    label: 'Advance',
    icon: 'fa-money-bill-transfer',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
  },
  overtime: {
    label: 'Overtime',
    icon: 'fa-business-time',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  }
}

/** "2026-08-15 16:17:18" is not ISO — normalize before sorting. */
function toTimestamp(value) {
  if (!value) return 0
  const parsed = Date.parse(String(value).replace(' ', 'T'))
  return Number.isNaN(parsed) ? 0 : parsed
}

const pendingRequests = computed(() => {
  return [...store.inbox, ...store.advances, ...store.overtime].sort(
    (a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at)
  )
})

const displayedRequests = computed(() => {
  if (upcomingTypes.includes(typeFilter.value)) return []

  const source = activeTab.value === 'pending' ? pendingRequests.value : store.resolvedLog
  if (typeFilter.value === 'all') return source
  return source.filter((req) => (req.request_type || 'leave') === typeFilter.value)
})

const showComingSoon = computed(() => upcomingTypes.includes(typeFilter.value))

const isLoading = computed(
  () => store.loading || store.advancesLoading || store.overtimeLoading
)

const listContainerClass = computed(() =>
  viewStyle.value === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
    : 'grid grid-cols-1 gap-4'
)

const drawerRequest = computed(() => {
  const selected = store.selectedRequest
  const details = store.requestDetails
  if (selected && details && details.id === selected.id) return { ...selected, ...details }
  return selected ?? details
})

const drawerCanAct = computed(
  () => activeTab.value === 'pending' && Boolean(drawerRequest.value) && canActOn(drawerRequest.value)
)

function typeOf(req) {
  return req?.request_type || 'leave'
}

function typeStyle(req) {
  return TYPE_STYLES[typeOf(req)] ?? TYPE_STYLES.leave
}

function canActOn(req) {
  const type = typeOf(req)
  if (type === 'advance') return store.canActOnAdvances
  if (type === 'overtime') return store.canActOnOvertime
  return store.canActOnRequests
}

function subtitleOf(req) {
  const type = typeOf(req)
  if (type === 'advance') return 'Salary Advance'
  if (type === 'overtime') return 'Overtime Work'
  return req.leave_type_name || 'Leave Request'
}

function unitLabel(req) {
  const n = Number(req?.units_requested)
  if (!Number.isFinite(n)) return '—'
  const suffix = req?.duration_type === 'day' ? 'day' : 'hr'
  return `${n} ${suffix}${n === 1 ? '' : 's'}`
}

/** Bold headline on the right side of a row. */
function primaryLine(req) {
  const type = typeOf(req)
  if (type === 'advance') return `Requested: ${money(req.requested_amount)}`
  if (type === 'overtime') return formatDate(req.request_date)
  return `${formatDate(req.start_date)} to ${formatDate(req.end_date)}`
}

/** Muted supporting line under the headline. */
function secondaryLine(req) {
  const type = typeOf(req)
  if (type === 'advance') {
    const months = req.repayment_months ? `${req.repayment_months} month(s)` : '—'
    return `Base Monthly: ${money(req.basic_salary)} • Repaid over ${months}`
  }
  if (type === 'overtime') return `Duration: ${unitLabel(req)}`
  return `${durationLabel(req)} requested`
}

function money(value) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? formatCurrency(n) : '—'
}

function showToast(message, variant = 'info') {
  toast.value = { message, variant }
  setTimeout(() => {
    toast.value = null
  }, 3000)
}

function durationLabel(req) {
  const days = req?.duration_days
  if (days === null || days === undefined || Number.isNaN(Number(days))) return '—'
  const n = Number(days)
  return `${n} day${n === 1 ? '' : 's'}`
}

function statusLabel(status) {
  if (!status) return 'pending'
  return String(status).replaceAll('_', ' ')
}

function statusTone(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('approved') || s === 'paid_off') {
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  }
  if (s.includes('rejected')) {
    return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  }
  return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
}

function statusIcon(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('approved') || s === 'paid_off') return 'fa-check'
  if (s.includes('rejected')) return 'fa-xmark'
  return 'fa-spinner'
}

async function loadRequests() {
  const tasks = [store.fetchInbox(), store.fetchOvertime()]
  if (store.canViewAdvances) tasks.push(store.fetchAdvances())

  // Each store action already records its own error; keep the others running.
  await Promise.allSettled(tasks)
}

function openDetails(req) {
  store.openDrawer(req.id)

  const type = typeOf(req)
  if (type === 'advance') store.fetchAdvanceDetails(req.id).catch(() => {})
  else if (type === 'overtime') store.fetchOvertimeDetails(req.id).catch(() => {})
}

async function handleApprove(req, options = {}) {
  const type = typeOf(req)
  try {
    if (type === 'advance') await store.approveAdvance(req.id)
    else if (type === 'overtime') await store.approveOvertime(req.id, options)
    else await store.approveRequest(req.id)

    showToast(`${typeStyle(req).label} request approved successfully.`, 'success')
  } catch {
    showToast(store.error || 'Failed to approve request.', 'error')
  }
}

function openRejection(req) {
  rejectionTarget.value = req
  rejectionModalOpen.value = true
}

async function handleRejectionSubmit(reason) {
  const req = rejectionTarget.value
  if (!req) return

  const type = typeOf(req)
  try {
    if (type === 'advance') await store.rejectAdvance(req.id, reason)
    else if (type === 'overtime') await store.rejectOvertime(req.id, reason)
    else await store.rejectRequest(req.id, reason)

    rejectionModalOpen.value = false
    rejectionTarget.value = null
    showToast(`${typeStyle(req).label} request rejected.`, 'error')
  } catch {
    showToast(store.error || 'Failed to reject request.', 'error')
  }
}

async function handlePayInstallment(installment) {
  const req = drawerRequest.value
  if (!req || !installment?.id) return

  try {
    await store.payAdvanceInstallment(req.id, installment.id)
    showToast('Installment marked as paid.', 'success')
  } catch {
    showToast(store.error || 'Failed to mark the installment as paid.', 'error')
  }
}

onMounted(() => {
  loadRequests()
})
</script>

<template>
  <section class="space-y-6 max-w-7xl mx-auto">
    <header>
      <h1 class="text-xl font-bold text-khubrat-blue dark:text-khubrat-goldLight">
        Requests Inbox &amp; Decision Ledger
      </h1>
      <p class="text-xs text-slate-400 mt-1">Review and decide on employee requests awaiting your action.</p>
    </header>

  <!-- Stats -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div class="space-y-1">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Decision</p>
          <h3 class="text-2xl font-black text-amber-500">{{ store.totalPendingCount }}</h3>
          <p class="text-[10px] text-slate-500 font-semibold">Action required immediately</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xl">
          <i class="fa-solid fa-hourglass-half"></i>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div class="space-y-1">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved This Session</p>
          <h3 class="text-2xl font-black text-emerald-500">{{ store.resolvedCount }}</h3>
          <p class="text-[10px] text-slate-500 font-semibold">Processed in active log</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl">
          <i class="fa-solid fa-square-check"></i>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-2 flex flex-col justify-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Module Coverage</p>
        <div class="flex flex-wrap gap-2">
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Leaves — {{ store.pendingCount }} pending
          </span>
          <span
            v-if="store.canViewAdvances"
            class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-sky-500/10 text-sky-600 border border-sky-500/20"
          >
            Advances — {{ store.advancesCount }} pending
          </span>
          <span
            v-else
            class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700"
          >
            Advances — HR only
          </span>
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Overtime — {{ store.overtimeCount }} pending
          </span>
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700">
            Permissions — Soon
          </span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
      <div class="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          class="px-4 py-2 text-xs font-bold rounded-lg transition-all"
          :class="activeTab === 'pending'
            ? 'bg-khubrat-blue text-white dark:bg-khubrat-goldLight dark:text-khubrat-blue shadow-sm'
            : 'text-slate-500 dark:text-slate-400'"
          @click="activeTab = 'pending'"
        >
          Pending Box
        </button>
        <button
          type="button"
          class="px-4 py-2 text-xs rounded-lg transition-all"
          :class="activeTab === 'history'
            ? 'bg-khubrat-blue text-white dark:bg-khubrat-goldLight dark:text-khubrat-blue shadow-sm font-bold'
            : 'text-slate-500 dark:text-slate-400 font-semibold'"
          @click="activeTab = 'history'"
        >
          Decision Log History
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
        <BaseSelect
          v-model="typeFilter"
          :options="REQUEST_TYPES"
          class="w-48"
        />

        <div class="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
          <button
            type="button"
            class="p-2 text-xs rounded-lg transition-all"
            :class="viewStyle === 'list'
              ? 'bg-white dark:bg-slate-800 shadow-sm text-khubrat-blue dark:text-khubrat-goldLight'
              : 'text-slate-400'"
            @click="viewStyle = 'list'"
          >
            <i class="fa-solid fa-list-ul"></i>
          </button>
          <button
            type="button"
            class="p-2 text-xs rounded-lg transition-all"
            :class="viewStyle === 'grid'
              ? 'bg-white dark:bg-slate-800 shadow-sm text-khubrat-blue dark:text-khubrat-goldLight'
              : 'text-slate-400'"
            @click="viewStyle = 'grid'"
          >
            <i class="fa-solid fa-grip-vertical"></i>
          </button>
        </div>
      </div>
    </div>

    <BaseAlert v-if="store.error && !isLoading" variant="error">{{ store.error }}</BaseAlert>

    <BaseAlert v-if="!store.canActOnRequests" variant="info">
      Your account can view requests but cannot approve or reject them. Only HR managers and department managers can take action.
    </BaseAlert>

    <BaseAlert v-else-if="typeFilter === 'advance' && !store.canViewAdvances" variant="info">
      Salary advances skip the department manager stage — only HR managers review them.
    </BaseAlert>

    <LoadingSpinner v-if="isLoading && activeTab === 'pending'" label="Loading requests…" />

    <div
      v-else-if="showComingSoon"
      class="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3"
    >
      <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto text-slate-400 text-2xl">
        <i class="fa-solid fa-screwdriver-wrench"></i>
      </div>
      <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200">Module coming soon</h4>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        This request type is not wired to the backend yet. Leaves, advances and overtime are fully supported in this build.
      </p>
    </div>

    <div v-else-if="!displayedRequests.length" class="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
      <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto text-slate-400 text-2xl">
        <i class="fa-solid fa-folder-open"></i>
      </div>
      <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200">No requests match this view</h4>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        <template v-if="activeTab === 'pending'">There are no pending requests in your inbox.</template>
        <template v-else>Resolved requests from this session will appear here. A full history API is not yet available.</template>
      </p>
    </div>

    <div v-else :class="listContainerClass">
      <article
        v-for="req in displayedRequests"
        :key="`${typeOf(req)}-${req.id}`"
        class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all p-4"
        :class="viewStyle === 'grid' ? 'flex flex-col justify-between gap-4' : 'flex flex-col md:flex-row items-start md:items-center justify-between gap-4'"
      >
        <div class="flex items-center gap-4 min-w-0">
          <div
            class="w-11 h-11 rounded-xl bg-khubrat-blue/10 dark:bg-khubrat-goldLight/10 text-khubrat-blue dark:text-khubrat-goldLight flex items-center justify-center font-bold text-sm shrink-0"
          >
            {{ initials(req.employee_name) }}
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ req.employee_name }}</h4>
              <span
                class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border"
                :class="typeStyle(req).badge"
              >
                <i class="fa-solid mr-1" :class="typeStyle(req).icon"></i>
                {{ typeStyle(req).label }}
              </span>
            </div>
            <div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span class="text-slate-500 dark:text-slate-400 font-semibold">{{ subtitleOf(req) }}</span>
              <span v-if="req.department_name" class="text-[10px] text-slate-400">
                • {{ req.department_name }}
              </span>
              <span
                v-if="req.attachment_url"
                class="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400"
                title="Supporting document attached"
              >
                <i class="fa-solid fa-paperclip"></i>
                Attachment
              </span>
            </div>
          </div>
        </div>

        <div
          class="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700"
        >
          <div class="md:text-right min-w-0">
            <p class="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
              {{ primaryLine(req) }}
            </p>
            <p class="text-[10px] text-slate-400 mt-0.5 truncate">{{ secondaryLine(req) }}</p>
          </div>

          <div class="flex items-center gap-3 justify-end">
            <span
              class="px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize border"
              :class="statusTone(req.status)"
            >
              <i class="fa-solid mr-1" :class="statusIcon(req.status)"></i>
              {{ statusLabel(req.status) }}
            </span>

            <button
              type="button"
              class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
              @click="openDetails(req)"
            >
              {{ viewStyle === 'grid' ? 'Details' : 'View File' }}
            </button>

            <template v-if="activeTab === 'pending' && canActOn(req)">
              <button
                type="button"
                class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                :disabled="store.actionLoading"
                @click="handleApprove(req)"
              >
                Approve
              </button>
              <button
                type="button"
                class="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                :disabled="store.actionLoading"
                @click="openRejection(req)"
              >
                Reject
              </button>
            </template>
          </div>
        </div>
      </article>
    </div>

    <RequestDetailsDrawer
      :open="store.drawerOpen"
      :request="drawerRequest"
      :can-act="drawerCanAct"
      :can-pay-installments="store.canActOnAdvances"
      :action-loading="store.actionLoading"
      :details-loading="store.detailsLoading"
      @close="store.closeDrawer()"
      @approve="handleApprove"
      @reject="openRejection"
      @pay-installment="handlePayInstallment"
    />

    <LeaveRejectionModal
      :open="rejectionModalOpen"
      :loading="store.actionLoading"
      @close="rejectionModalOpen = false"
      @submit="handleRejectionSubmit"
    />

    <Transition name="fade">
      <div
        v-if="toast"
        class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl font-bold text-xs text-white"
        :class="toast.variant === 'success' ? 'bg-emerald-600' : toast.variant === 'error' ? 'bg-rose-600' : 'bg-slate-800'"
      >
        {{ toast.message }}
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

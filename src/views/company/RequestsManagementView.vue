<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import LeaveRequestDrawer from '@/components/requests/LeaveRequestDrawer.vue'
import LeaveRejectionModal from '@/components/requests/LeaveRejectionModal.vue'
import { useManagementLeavesStore } from '@/stores/managementLeaves.store'
import { formatDate, initials } from '@/utils/format'

const store = useManagementLeavesStore()

const activeTab = ref('pending')
const typeFilter = ref('all')
const viewStyle = ref('list')
const rejectionModalOpen = ref(false)
const rejectionTargetId = ref(null)
const toast = ref(null)

const REQUEST_TYPES = [
  { value: 'all', label: 'All Request Types' },
  { value: 'leave', label: 'Leaves' },
  { value: 'advance', label: 'Advances' },
  { value: 'permission', label: 'Permissions' },
  { value: 'overtime', label: 'Overtime' }
]

const upcomingTypes = ['advance', 'permission', 'overtime']

const displayedLeaves = computed(() => {
  if (typeFilter.value !== 'all' && typeFilter.value !== 'leave') return []
  return activeTab.value === 'pending' ? store.inbox : store.resolvedLog
})

const showComingSoon = computed(() => upcomingTypes.includes(typeFilter.value))

const listContainerClass = computed(() =>
  viewStyle.value === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
    : 'grid grid-cols-1 gap-4'
)

function showToast(message, variant = 'info') {
  toast.value = { message, variant }
  setTimeout(() => {
    toast.value = null
  }, 3000)
}

async function loadInbox() {
  try {
    await store.fetchInbox()
  } catch {
    // Error surfaced via store.error
  }
}

function openDrawer(id) {
  store.openDrawer(id)
}

async function handleApprove(id) {
  try {
    await store.approveRequest(id)
    showToast('Leave request approved successfully.', 'success')
  } catch {
    showToast(store.error || 'Failed to approve request.', 'error')
  }
}

function openRejection(id) {
  rejectionTargetId.value = id
  rejectionModalOpen.value = true
}

async function handleRejectionSubmit(reason) {
  if (!rejectionTargetId.value) return
  try {
    await store.rejectRequest(rejectionTargetId.value, reason)
    rejectionModalOpen.value = false
    rejectionTargetId.value = null
    showToast('Leave request rejected.', 'error')
  } catch {
    showToast(store.error || 'Failed to reject request.', 'error')
  }
}

onMounted(() => {
  loadInbox()
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
          <h3 class="text-2xl font-black text-amber-500">{{ store.pendingCount }}</h3>
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
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-500/10 text-blue-600 border border-blue-500/20">
            Leaves — Live
          </span>
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700">
            Advances — Soon
          </span>
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700">
            Overtime — Soon
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

    <BaseAlert v-if="store.error && !store.loading" variant="error">{{ store.error }}</BaseAlert>

    <BaseAlert v-if="!store.canActOnRequests" variant="info">
      Your account can view requests but cannot approve or reject them. Only HR managers and department managers can take action.
    </BaseAlert>

    <LoadingSpinner v-if="store.loading && activeTab === 'pending'" label="Loading leave requests…" />

    <div
      v-else-if="showComingSoon"
      class="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3"
    >
      <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto text-slate-400 text-2xl">
        <i class="fa-solid fa-screwdriver-wrench"></i>
      </div>
      <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200">Module coming soon</h4>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        This request type is not wired to the backend yet. Leave requests are fully supported in this build.
      </p>
    </div>

    <div v-else-if="!displayedLeaves.length" class="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
      <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto text-slate-400 text-2xl">
        <i class="fa-solid fa-folder-open"></i>
      </div>
      <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200">No requests match this view</h4>
      <p class="text-xs text-slate-400 max-w-sm mx-auto">
        <template v-if="activeTab === 'pending'">There are no pending leave requests in your inbox.</template>
        <template v-else>Resolved requests from this session will appear here. A full history API is not yet available.</template>
      </p>
    </div>

    <div v-else :class="listContainerClass">
      <article
        v-for="req in displayedLeaves"
        :key="req.id"
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
              <span class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <i class="fa-solid fa-plane-departure mr-1"></i> Leave Request
              </span>
            </div>
            <div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span class="font-black text-slate-800 dark:text-slate-100">
                {{ req.duration_days }} day(s)
                <span class="text-[10px] font-normal text-slate-400">({{ req.leave_type_name }})</span>
              </span>
              <span class="text-[10px] text-slate-400">• {{ formatDate(req.start_date) }} – {{ formatDate(req.end_date) }}</span>
            </div>
          </div>
        </div>

        <div
          class="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700"
        >
          <span
            class="px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize border"
            :class="req.status === 'approved'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : req.status === 'rejected'
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'"
          >
            <i
              class="fa-solid mr-1"
              :class="req.status === 'approved' ? 'fa-check' : req.status === 'rejected' ? 'fa-xmark' : 'fa-spinner'"
            ></i>
            {{ req.status || 'pending' }}
          </span>

          <button
            type="button"
            class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            @click="openDrawer(req.id)"
          >
            {{ viewStyle === 'grid' ? 'Details' : 'View File' }}
          </button>

          <template v-if="activeTab === 'pending' && store.canActOnRequests">
            <button
              type="button"
              class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60"
              :disabled="store.actionLoading"
              @click="handleApprove(req.id)"
            >
              Approve
            </button>
            <button
              type="button"
              class="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60"
              :disabled="store.actionLoading"
              @click="openRejection(req.id)"
            >
              Reject
            </button>
          </template>
        </div>
      </article>
    </div>

    <LeaveRequestDrawer
      :open="store.drawerOpen"
      :request="store.selectedRequest"
      :can-act="store.canActOnRequests && activeTab === 'pending'"
      :action-loading="store.actionLoading"
      @close="store.closeDrawer()"
      @approve="handleApprove"
      @reject="openRejection"
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

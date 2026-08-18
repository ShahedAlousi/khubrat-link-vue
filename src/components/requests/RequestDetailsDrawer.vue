<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { managementRequestsService, resolveAttachmentDisplayUrl } from '@/services/managementRequests.service'
import { formatCurrency, formatDate, initials } from '@/utils/format'

const props = defineProps({
  open: { type: Boolean, default: false },
  request: { type: Object, default: null },
  canAct: { type: Boolean, default: false },
  canPayInstallments: { type: Boolean, default: false },
  actionLoading: { type: Boolean, default: false },
  detailsLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'approve', 'reject', 'pay-installment'])

const employeeInitials = computed(() => initials(props.request?.employee_name))

const requestType = computed(() => props.request?.request_type || 'leave')
const isLeave = computed(() => requestType.value === 'leave')
const isAdvance = computed(() => requestType.value === 'advance')
const isOvertime = computed(() => requestType.value === 'overtime')

const typeHeading = computed(() => {
  if (isAdvance.value) return 'Salary Advance File'
  if (isOvertime.value) return 'Overtime Request File'
  return 'Leave Request File'
})

const attachmentPath = computed(() => props.request?.attachment_url || null)

const attachmentBusy = ref(false)
const attachmentError = ref(null)
const previewFailed = ref(false)

const attachmentHref = computed(() => {
  const path = attachmentPath.value
  return path ? resolveAttachmentDisplayUrl(path) : ''
})

// Overtime reviewers may approve fewer units than requested.
const approvedUnits = ref(null)
const reviewNotes = ref('')

const attachmentMeta = computed(() => {
  const path = attachmentPath.value
  if (!path) return null

  const clean = String(path).split('?')[0]
  const fileName = clean.split('/').pop() || 'attachment'
  const ext = (fileName.includes('.') ? fileName.split('.').pop() : '').toLowerCase()

  const isPdf = ext === 'pdf'
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)

  return {
    path,
    fileName: decodeURIComponent(fileName),
    ext: ext || 'file',
    isPdf,
    isImage,
    kindLabel: isPdf ? 'PDF document' : isImage ? 'Image attachment' : 'Supporting file'
  }
})

const durationLabel = computed(() => {
  const days = props.request?.duration_days
  if (days === null || days === undefined || Number.isNaN(Number(days))) return '—'
  const n = Number(days)
  return `${n} day${n === 1 ? '' : 's'}`
})

const unitSuffix = computed(() => (props.request?.duration_type === 'day' ? 'day' : 'hr'))

function formatUnits(value) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n} ${unitSuffix.value}${n === 1 ? '' : 's'}`
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? formatCurrency(n) : '—'
}

const statusLabel = computed(() => {
  const raw = props.request?.status
  if (!raw) return '—'
  return String(raw).replaceAll('_', ' ')
})

const statusTone = computed(() => {
  const s = String(props.request?.status || '').toLowerCase()
  if (s.includes('approved') || s === 'paid_off') {
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  }
  if (s.includes('rejected')) return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
})

const installments = computed(() =>
  Array.isArray(props.request?.installments) ? props.request.installments : []
)

function display(value) {
  return value === null || value === undefined || value === '' ? '—' : value
}

watch(
  () => [props.open, props.request?.id, props.request?.attachment_url],
  () => {
    previewFailed.value = false
    attachmentError.value = null
    attachmentBusy.value = false
  }
)

watch(
  () => [props.open, props.request?.id, props.request?.units_requested],
  () => {
    if (!props.open) return
    approvedUnits.value = props.request?.units_approved ?? props.request?.units_requested ?? null
    reviewNotes.value = props.request?.review_notes ?? ''
  },
  { immediate: true }
)

async function withAttachmentBlob(handler) {
  const meta = attachmentMeta.value
  const href = attachmentHref.value
  if (!meta?.path && !href) return

  attachmentBusy.value = true
  attachmentError.value = null
  let objectUrl = null

  try {
    const blob = await managementRequestsService.fetchAttachment(meta.path || href)
    objectUrl = URL.createObjectURL(blob)
    handler(objectUrl, blob, meta)
  } catch (err) {
    if (href) {
      handler(href, null, meta)
      return
    }
    attachmentError.value = err.message || 'Failed to load attachment.'
  } finally {
    if (objectUrl) {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    }
    attachmentBusy.value = false
  }
}

function openAttachment() {
  const href = attachmentHref.value
  if (href) {
    window.open(href, '_blank', 'noopener,noreferrer')
    return
  }
  return withAttachmentBlob((objectUrl) => {
    window.open(objectUrl, '_blank', 'noopener,noreferrer')
  })
}

function downloadAttachment() {
  return withAttachmentBlob((objectUrl, blob, meta) => {
    const link = document.createElement('a')
    link.href = objectUrl
    if (blob) link.download = meta.fileName
    else link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    link.remove()
  })
}

function onPreviewError() {
  previewFailed.value = true
}

function handleApprove() {
  if (!props.request) return

  if (isOvertime.value) {
    const parsed = Number(approvedUnits.value)
    emit('approve', props.request, {
      hours_approved: Number.isFinite(parsed) ? parsed : null,
      review_notes: reviewNotes.value?.trim() || null
    })
    return
  }

  emit('approve', props.request, {})
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/55 backdrop-blur-[1px]" @click="emit('close')" />

      <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          class="pointer-events-auto w-screen max-w-md bg-white dark:bg-slate-800 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700"
        >
          <div class="bg-khubrat-blue text-white p-6 border-b border-khubrat-goldLight/20">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-sm font-extrabold text-khubrat-goldLight uppercase tracking-wider">
                {{ typeHeading }}
              </h2>
              <button class="text-white/60 hover:text-white transition-all" @click="emit('close')">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
          </div>

          <div v-if="request" class="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
            <div class="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div
                class="w-14 h-14 rounded-2xl bg-khubrat-blue/10 dark:bg-khubrat-goldLight/10 text-khubrat-blue dark:text-khubrat-goldLight flex items-center justify-center font-black text-lg shrink-0"
              >
                {{ employeeInitials }}
              </div>
              <div class="min-w-0">
                <h3 class="text-base font-extrabold text-slate-800 dark:text-slate-100 truncate">
                  {{ request.employee_name }}
                </h3>
                <p class="text-xs text-slate-400">{{ display(request.department_name) }}</p>
                <p v-if="request.job_title" class="text-[10px] text-slate-400 mt-0.5">
                  {{ request.job_title }}
                </p>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Request Parameters
                </p>
                <span v-if="detailsLoading" class="text-[10px] text-slate-400">
                  <i class="fa-solid fa-spinner fa-spin mr-1"></i> Loading details…
                </span>
              </div>

              <!-- ---------------------------------------------------- Leave -->
              <template v-if="isLeave">
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">Leave Category</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ display(request.leave_type_name) }}
                    </p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">Duration</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ durationLabel }}
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">Start Date</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ formatDate(request.start_date) }}
                    </p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">End Date</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ formatDate(request.end_date) }}
                    </p>
                  </div>
                </div>

                <div v-if="request.start_time || request.end_time" class="grid grid-cols-2 gap-4">
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">Start Time</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ display(request.start_time) }}
                    </p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">End Time</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ display(request.end_time) }}
                    </p>
                  </div>
                </div>

                <div
                  v-if="request.remaining_balance_days !== null && request.remaining_balance_days !== undefined"
                  class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <p class="text-[10px] font-bold text-slate-400">Remaining Balance</p>
                  <p class="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {{ request.remaining_balance_days }} day(s)
                  </p>
                </div>
              </template>

              <!-- -------------------------------------------------- Advance -->
              <template v-else-if="isAdvance">
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">Requested Amount</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ formatMoney(request.requested_amount) }}
                    </p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">Repayment Period</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ display(request.repayment_months) }} month(s)
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">Monthly Installment</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ formatMoney(request.monthly_installment) }}
                    </p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">Base Monthly Salary</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ formatMoney(request.basic_salary) }}
                    </p>
                  </div>
                </div>
              </template>

              <!-- ------------------------------------------------- Overtime -->
              <template v-else-if="isOvertime">
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">Work Date</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ formatDate(request.request_date) }}
                    </p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">Requested Duration</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ formatUnits(request.units_requested) }}
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">Estimated Amount</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ formatMoney(request.estimated_amount) }}
                    </p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p class="text-[10px] font-bold text-slate-400">Approved Duration</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {{ formatUnits(request.units_approved) }}
                    </p>
                  </div>
                </div>

                <div
                  v-if="request.calculated_amount !== null && request.calculated_amount !== undefined"
                  class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <p class="text-[10px] font-bold text-slate-400">Calculated Payout</p>
                  <p class="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {{ formatMoney(request.calculated_amount) }}
                  </p>
                </div>
              </template>

              <!-- ------------------------------------------------ Shared -->
              <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <p class="text-[10px] font-bold text-slate-400">Reason Note</p>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{{ display(request.reason) }}</p>
              </div>

              <div
                v-if="request.rejection_reason"
                class="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-900 space-y-1"
              >
                <p class="text-[10px] font-bold text-rose-500">Rejection Reason</p>
                <p class="text-xs text-rose-600 dark:text-rose-300 leading-relaxed">
                  {{ request.rejection_reason }}
                </p>
              </div>

              <div
                v-if="isOvertime && request.review_notes"
                class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1"
              >
                <p class="text-[10px] font-bold text-slate-400">Reviewer Notes</p>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {{ request.review_notes }}
                </p>
              </div>

              <!-- Installment schedule (advances only) -->
              <div v-if="isAdvance" class="space-y-2">
                <p class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Repayment Schedule
                </p>

                <div
                  v-if="installments.length"
                  class="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700"
                >
                  <div
                    v-for="(installment, index) in installments"
                    :key="installment.id || index"
                    class="flex items-center gap-3 p-3"
                  >
                    <div
                      class="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[11px] font-black text-slate-500 shrink-0"
                    >
                      {{ installment.sequence || index + 1 }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {{ formatMoney(installment.amount) }}
                      </p>
                      <p class="text-[10px] text-slate-400 mt-0.5">
                        Due {{ formatDate(installment.due_date) }}
                      </p>
                    </div>
                    <span
                      class="px-2 py-1 rounded-lg text-[10px] font-bold capitalize border"
                      :class="installment.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'"
                    >
                      {{ display(installment.status) }}
                    </span>
                    <button
                      v-if="canPayInstallments && installment.status !== 'paid' && installment.id"
                      type="button"
                      class="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                      :disabled="actionLoading"
                      @click="emit('pay-installment', installment)"
                    >
                      Mark paid
                    </button>
                  </div>
                </div>

                <div
                  v-else
                  class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center"
                >
                  <p class="text-[11px] text-slate-400">
                    The repayment schedule is generated once the advance is approved.
                  </p>
                </div>
              </div>

              <!-- Supporting attachment (image / PDF) -->
              <div v-if="isLeave || attachmentMeta" class="space-y-2">
                <p class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Supporting Document
                </p>

                <div
                  v-if="attachmentMeta"
                  class="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-hidden"
                >
                  <div class="flex items-center gap-3 p-3">
                    <!-- File type badge -->
                    <div
                      class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                      :class="attachmentMeta.isPdf
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-800 text-rose-500'
                        : attachmentMeta.isImage
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200/70 dark:border-sky-800 text-sky-500'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500'"
                      :title="attachmentMeta.kindLabel"
                    >
                      <!-- Inline SVG so the file icon always renders (independent of FA CDN) -->
                      <svg
                        v-if="attachmentMeta.isPdf"
                        class="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M9.5 15.5v-4H11c.8 0 1.3.4 1.3 1s-.5 1-1.3 1h-1.5" />
                        <path d="M14 11.5h1.2c.7 0 1.1.4 1.1 1v2c0 .6-.4 1-1.1 1H14v-4z" />
                      </svg>
                      <svg
                        v-else-if="attachmentMeta.isImage"
                        class="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <circle cx="10" cy="13" r="1.4" fill="currentColor" stroke="none" />
                        <path d="M8 19l3-3.5 2 2 3-4 3 5.5H8z" />
                      </svg>
                      <svg
                        v-else
                        class="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="13" y2="17" />
                      </svg>
                    </div>

                    <div class="min-w-0 flex-1">
                      <p class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {{ attachmentMeta.fileName }}
                      </p>
                      <p class="text-[10px] text-slate-400 mt-0.5">{{ attachmentMeta.kindLabel }}</p>
                    </div>

                    <!-- Compact gray view / download actions -->
                    <div class="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        title="View file"
                        :disabled="attachmentBusy"
                        @click="openAttachment"
                      >
                        <svg
                          v-if="!attachmentBusy"
                          class="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <i v-else class="fa-solid fa-spinner fa-spin text-sm" aria-hidden="true"></i>
                      </button>
                      <button
                        type="button"
                        class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        title="Download file"
                        :disabled="attachmentBusy"
                        @click="downloadAttachment"
                      >
                        <svg
                          v-if="!attachmentBusy"
                          class="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <i v-else class="fa-solid fa-spinner fa-spin text-sm" aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>

                  <div v-if="attachmentMeta.isImage" class="px-3 pb-3">
                    <button
                      type="button"
                      class="block w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-khubrat-goldLight/40"
                      title="Open image"
                      @click="openAttachment"
                    >
                      <img
                        v-if="attachmentHref && !previewFailed"
                        :src="attachmentHref"
                        :alt="attachmentMeta.fileName"
                        class="w-full max-h-48 object-contain bg-slate-100/80 dark:bg-slate-950/40"
                        @error="onPreviewError"
                      />
                      <div
                        v-else
                        class="flex items-center justify-center gap-2 h-28 text-[11px] text-slate-400"
                      >
                        <i class="fa-solid fa-image" aria-hidden="true"></i>
                        Preview unavailable — use View or Download
                      </div>
                    </button>
                  </div>

                  <div v-else-if="attachmentMeta.isPdf" class="px-3 pb-3">
                    <iframe
                      v-if="attachmentHref && !previewFailed"
                      :src="attachmentHref"
                      title="PDF preview"
                      class="w-full h-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
                      @error="onPreviewError"
                    />
                    <div
                      v-else
                      class="flex items-center justify-center gap-2 h-28 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-[11px] text-slate-400"
                    >
                      <i class="fa-solid fa-file-pdf" aria-hidden="true"></i>
                      Open the PDF with View or Download
                    </div>
                  </div>

                  <p v-if="attachmentError" class="px-3 pb-3 text-[11px] text-rose-500">
                    {{ attachmentError }}
                  </p>
                </div>

                <div
                  v-else
                  class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center"
                >
                  <p class="text-[11px] text-slate-400">No supporting file was attached to this request.</p>
                </div>
              </div>

              <!-- Reviewer inputs for overtime decisions -->
              <div
                v-if="canAct && isOvertime"
                class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-slate-400">
                    Approved Duration ({{ unitSuffix }}s)
                  </label>
                  <input
                    v-model.number="approvedUnits"
                    type="number"
                    min="0"
                    step="1"
                    class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
                  />
                  <p class="text-[10px] text-slate-400">
                    Defaults to the requested duration. Lower it to approve partially.
                  </p>
                </div>

                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-slate-400">Reviewer Notes (optional)</label>
                  <textarea
                    v-model="reviewNotes"
                    rows="2"
                    placeholder="Add a note for the payroll record…"
                    class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                <span
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold border capitalize"
                  :class="statusTone"
                >
                  {{ statusLabel }}
                </span>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
            <template v-if="canAct && request">
              <BaseButton
                class="flex-1 !bg-emerald-600 hover:!bg-emerald-700 !text-white"
                :loading="actionLoading"
                @click="handleApprove"
              >
                <i class="fa-solid fa-check"></i>
                Approve Request
              </BaseButton>
              <BaseButton
                class="flex-1 !bg-rose-600 hover:!bg-rose-700 !text-white"
                :loading="actionLoading"
                @click="emit('reject', request)"
              >
                <i class="fa-solid fa-xmark"></i>
                Reject Request
              </BaseButton>
            </template>
            <BaseButton v-else class="w-full" variant="ghost" @click="emit('close')">
              Close Details File
            </BaseButton>
          </div>
        </aside>
      </div>
    </div>
  </Teleport>
</template>

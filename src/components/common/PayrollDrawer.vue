<script setup>
import { computed, ref, watch } from 'vue'
import salariesService from '@/services/salaries.service'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { formatCurrency, formatDate, initials } from '@/utils/format'

const props = defineProps({
  salaryId: { type: [String, Number], required: true },
  onClose: { type: Function, default: null }
})

const emit = defineEmits(['close', 'paid'])

const loading = ref(true)
const paying = ref(false)
const error = ref(null)
const details = ref(null)

const HIDDEN_KEYS = new Set([
  'id',
  'employee_id',
  'employee_name',
  'department_name',
  'job_title',
  'period',
  'month',
  'year',
  'status',
  'is_received',
  'base_salary',
  'basic_salary',
  'total_additions',
  'total_deductions',
  'net_salary',
  'gross_salary',
  'paid_at',
  'created_at',
  'updated_at',
  'payment_summary',
  'additions',
  'deductions',
  'components',
  'line_items',
  'breakdown',
  'items'
])

const MONEY_KEYS = new Set([
  'base_salary',
  'basic_salary',
  'total_additions',
  'total_deductions',
  'net_salary',
  'gross_salary',
  'amount',
  'value',
  'overtime_amount',
  'bonus',
  'allowance',
  'tax',
  'insurance'
])

function close() {
  if (props.onClose) props.onClose()
  emit('close')
}

function display(value) {
  return value === null || value === undefined || value === '' ? '—' : value
}

function humanizeKey(key) {
  return String(key || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? formatCurrency(n) : String(value)
}

function formatFieldValue(key, value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (MONEY_KEYS.has(key) || /salary|amount|bonus|allowance|deduction|addition|tax|pay/i.test(key)) {
    const n = Number(value)
    if (Number.isFinite(n)) return formatCurrency(n)
  }
  if (/_at$|_date$|date/i.test(key) && (typeof value === 'string' || typeof value === 'number')) {
    return formatDate(value)
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function unwrapPayload(resp) {
  if (!resp || typeof resp !== 'object') return {}
  if (resp.data && typeof resp.data === 'object' && !Array.isArray(resp.data)) {
    return resp.data
  }
  return resp
}

function normalizeLines(source, forcedType = null) {
  if (!source) return []

  let raw = source
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      return [{ label: 'Note', amount: null, type: forcedType, note: raw }]
    }
  }

  if (!Array.isArray(raw) && typeof raw === 'object') {
    // Object map: { overtime: 50, bonus: 100 } or nested { additions: [], deductions: [] }
    if (Array.isArray(raw.additions) || Array.isArray(raw.deductions) || Array.isArray(raw.items)) {
      return [
        ...normalizeLines(raw.additions, 'addition'),
        ...normalizeLines(raw.deductions, 'deduction'),
        ...normalizeLines(raw.items, forcedType)
      ]
    }

    return Object.entries(raw).map(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const amount = value.amount ?? value.value ?? value.total ?? null
        return {
          label: value.name || value.label || value.title || humanizeKey(key),
          amount,
          type: value.type || forcedType || inferType(key, amount),
          note: value.note || value.description || value.reason || null
        }
      }
      return {
        label: humanizeKey(key),
        amount: value,
        type: forcedType || inferType(key, value),
        note: null
      }
    })
  }

  if (!Array.isArray(raw)) return []

  return raw.map((item, index) => {
    if (item == null) return null
    if (typeof item !== 'object') {
      const n = Number(item)
      return {
        label: `Item ${index + 1}`,
        amount: Number.isFinite(n) ? n : null,
        type: forcedType,
        note: Number.isFinite(n) ? null : String(item)
      }
    }

    const amount = item.amount ?? item.value ?? item.total ?? item.money ?? null
    const label =
      item.name || item.label || item.title || item.rule_name || item.type_name || `Item ${index + 1}`
    const type = item.type || item.category || forcedType || inferType(label, amount)
    const note = item.note || item.description || item.reason || item.details || null

    return { label, amount, type, note }
  }).filter(Boolean)
}

function inferType(label, amount) {
  const text = String(label || '').toLowerCase()
  if (/deduct|tax|penalty|absence|advance|loan|late/.test(text)) return 'deduction'
  if (/add|bonus|overtime|allowance|incentive|reward/.test(text)) return 'addition'
  if (amount != null && Number(amount) < 0) return 'deduction'
  return 'addition'
}

function collectLineItems(data) {
  const summary = data?.payment_summary
  const fromSummary = normalizeLines(summary)

  const fromDedicated = [
    ...normalizeLines(data?.additions, 'addition'),
    ...normalizeLines(data?.deductions, 'deduction'),
    ...normalizeLines(data?.components),
    ...normalizeLines(data?.line_items),
    ...normalizeLines(data?.breakdown),
    ...normalizeLines(data?.items)
  ]

  const merged = [...fromSummary, ...fromDedicated]
  // Deduplicate by label+amount+type
  const seen = new Set()
  return merged.filter((row) => {
    const key = `${row.label}|${row.amount}|${row.type}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function fetchDetails() {
  if (!props.salaryId) return
  loading.value = true
  error.value = null
  try {
    const resp = await salariesService.get(props.salaryId)
    details.value = unwrapPayload(resp)
  } catch (err) {
    error.value = err?.message || 'Failed to load salary details.'
    details.value = null
  } finally {
    loading.value = false
  }
}

async function pay() {
  if (!props.salaryId || details.value?.is_received) return
  paying.value = true
  error.value = null
  try {
    await salariesService.pay(props.salaryId)
    await fetchDetails()
    emit('paid')
  } catch (err) {
    error.value = err?.message || 'Failed to mark salary as paid.'
  } finally {
    paying.value = false
  }
}

watch(
  () => props.salaryId,
  () => {
    fetchDetails()
  },
  { immediate: true }
)

const employeeInitials = computed(() => initials(details.value?.employee_name))

const periodLabel = computed(() => {
  const d = details.value
  if (!d) return '—'
  if (d.period) return d.period
  if (d.month && d.year) return `${d.year}-${String(d.month).padStart(2, '0')}`
  return '—'
})

const statusLabel = computed(() => {
  const d = details.value
  if (!d) return '—'
  if (d.is_received) return 'Paid'
  if (d.status) return String(d.status).replaceAll('_', ' ')
  return 'Pending'
})

const statusTone = computed(() => {
  const label = String(statusLabel.value).toLowerCase()
  if (label.includes('paid') || label.includes('received')) {
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  }
  if (label.includes('draft')) {
    return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
  }
  return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
})

const baseSalary = computed(
  () => details.value?.base_salary ?? details.value?.basic_salary ?? null
)

const lineItems = computed(() => collectLineItems(details.value || {}))

const additionLines = computed(() =>
  lineItems.value.filter((row) => String(row.type).toLowerCase() !== 'deduction')
)

const deductionLines = computed(() =>
  lineItems.value.filter((row) => String(row.type).toLowerCase() === 'deduction')
)

const extraFields = computed(() => {
  const d = details.value
  if (!d || typeof d !== 'object') return []

  return Object.entries(d)
    .filter(([key, value]) => {
      if (HIDDEN_KEYS.has(key)) return false
      if (value === null || value === undefined || value === '') return false
      if (typeof value === 'object') return false
      return true
    })
    .map(([key, value]) => ({
      key,
      label: humanizeKey(key),
      value: formatFieldValue(key, value)
    }))
})

const paymentSummaryRaw = computed(() => {
  const summary = details.value?.payment_summary
  if (summary == null || summary === '') return null
  // Only fall back to raw view when we could not extract structured lines
  if (lineItems.value.length) return null
  if (typeof summary === 'string') return summary
  try {
    return JSON.stringify(summary, null, 2)
  } catch {
    return String(summary)
  }
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/55 backdrop-blur-[1px]" @click="close" />

      <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          class="pointer-events-auto w-screen max-w-md bg-white dark:bg-slate-800 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700"
        >
          <div class="bg-khubrat-blue text-white p-6 border-b border-khubrat-goldLight/20">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-sm font-extrabold text-khubrat-goldLight uppercase tracking-wider">
                Salary Details File
              </h2>
              <button class="text-white/60 hover:text-white transition-all" @click="close">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
            <div v-if="loading" class="py-16 flex justify-center">
              <LoadingSpinner />
            </div>

            <div
              v-else-if="error && !details"
              class="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-4 text-rose-600 dark:text-rose-300 text-xs"
            >
              {{ error }}
            </div>

            <template v-else-if="details">
              <div class="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                <div
                  class="w-14 h-14 rounded-2xl bg-khubrat-blue/10 dark:bg-khubrat-goldLight/10 text-khubrat-blue dark:text-khubrat-goldLight flex items-center justify-center font-black text-lg shrink-0"
                >
                  {{ employeeInitials || '—' }}
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-base font-extrabold text-slate-800 dark:text-slate-100 truncate">
                    {{ display(details.employee_name) }}
                  </h3>
                  <p v-if="details.department_name" class="text-xs text-slate-400">
                    {{ details.department_name }}
                  </p>
                  <p v-if="details.job_title" class="text-[10px] text-slate-400 mt-0.5">
                    {{ details.job_title }}
                  </p>
                </div>
                <span
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold border capitalize shrink-0"
                  :class="statusTone"
                >
                  {{ statusLabel }}
                </span>
              </div>

              <div
                class="rounded-2xl bg-gradient-to-br from-khubrat-blue to-[#001a5c] text-white p-5 shadow-lg"
              >
                <p class="text-[10px] font-extrabold uppercase tracking-wider text-khubrat-goldLight/80">
                  Net Salary · {{ periodLabel }}
                </p>
                <p class="text-3xl font-black text-khubrat-goldLight mt-1">
                  {{ formatMoney(details.net_salary) }}
                </p>
                <p v-if="details.paid_at" class="text-[11px] text-white/60 mt-2">
                  Paid on {{ formatDate(details.paid_at) }}
                </p>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div
                  class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <p class="text-[10px] font-bold text-slate-400">Base</p>
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {{ formatMoney(baseSalary) }}
                  </p>
                </div>
                <div
                  class="bg-emerald-50/70 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-900"
                >
                  <p class="text-[10px] font-bold text-emerald-600/80">Additions</p>
                  <p class="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {{ formatMoney(details.total_additions) }}
                  </p>
                </div>
                <div
                  class="bg-rose-50/70 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200/70 dark:border-rose-900"
                >
                  <p class="text-[10px] font-bold text-rose-600/80">Deductions</p>
                  <p class="text-xs font-bold text-rose-700 dark:text-rose-400 mt-0.5">
                    {{ formatMoney(details.total_deductions) }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div
                  class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <p class="text-[10px] font-bold text-slate-400">Period</p>
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {{ periodLabel }}
                  </p>
                </div>
                <div
                  class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <p class="text-[10px] font-bold text-slate-400">Gross</p>
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {{ formatMoney(details.gross_salary) }}
                  </p>
                </div>
              </div>

              <div v-if="additionLines.length" class="space-y-2">
                <p class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Additions Breakdown
                </p>
                <div
                  class="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700"
                >
                  <div
                    v-for="(row, index) in additionLines"
                    :key="`add-${index}`"
                    class="flex items-start justify-between gap-3 p-3"
                  >
                    <div class="min-w-0">
                      <p class="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {{ row.label }}
                      </p>
                      <p v-if="row.note" class="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        {{ row.note }}
                      </p>
                    </div>
                    <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      +{{ formatMoney(row.amount) }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="deductionLines.length" class="space-y-2">
                <p class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Deductions Breakdown
                </p>
                <div
                  class="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700"
                >
                  <div
                    v-for="(row, index) in deductionLines"
                    :key="`ded-${index}`"
                    class="flex items-start justify-between gap-3 p-3"
                  >
                    <div class="min-w-0">
                      <p class="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {{ row.label }}
                      </p>
                      <p v-if="row.note" class="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        {{ row.note }}
                      </p>
                    </div>
                    <span class="text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">
                      −{{ formatMoney(Math.abs(Number(row.amount) || 0)) }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="paymentSummaryRaw" class="space-y-2">
                <p class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Payment Summary
                </p>
                <pre
                  class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap"
                >{{ paymentSummaryRaw }}</pre>
              </div>

              <div v-if="extraFields.length" class="space-y-2">
                <p class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Additional Details
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <div
                    v-for="field in extraFields"
                    :key="field.key"
                    class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <p class="text-[10px] font-bold text-slate-400">{{ field.label }}</p>
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 break-words">
                      {{ field.value }}
                    </p>
                  </div>
                </div>
              </div>

              <p
                v-if="error"
                class="text-[11px] text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl px-3 py-2"
              >
                {{ error }}
              </p>
            </template>
          </div>

          <div
            class="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3"
          >
            <BaseButton class="flex-1" variant="ghost" @click="close">Close</BaseButton>
            <BaseButton
              class="flex-1"
              variant="blue"
              :loading="paying"
              :disabled="!details || details.is_received || loading"
              @click="pay"
            >
              {{ details?.is_received ? 'Already Paid' : 'Mark Paid' }}
            </BaseButton>
          </div>
        </aside>
      </div>
    </div>
  </Teleport>
</template>

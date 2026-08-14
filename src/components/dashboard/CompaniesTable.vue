<!-- <script setup>
import { computed, ref } from 'vue'
import { formatDate } from '@/utils/format'

const props = defineProps({
  companies: { type: Array, default: () => [] },
  // Real subscription plans (from /api/subscription-plans), used to power
  // the "All Packages" filter with real plan ids/names instead of guesses.
  plans: { type: Array, default: () => [] }
})

const emit = defineEmits(['view', 'freeze', 'activate', 'delete'])

const search = ref('')
const statusFilter = ref('all')
const packageFilter = ref('all')

// The API doesn't document the exact company shape returned by
// GET /api/companies, so these helpers read a few plausible field names
// defensively instead of assuming one fixed schema.
function companyStatus(company) {
  if (company.status) return company.status
  return company.active === false ? 'frozen' : 'active'
}

function companyPlanId(company) {
  return company.plan_id ?? company.subscription?.plan_id ?? company.subscription?.plan?.id ?? null
}

function companyPackage(company) {
  return company.package || company.current_subscription?.plan_type || company.subscription?.plan?.name || company.plan?.name || '—'
}

function companyContact(company) {
  return company.contact_name || company.manager_name || '—'
}

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return props.companies.filter((co) => {
    const matchesSearch =
      !term ||
      co.name?.toLowerCase().includes(term) ||
      co.email?.toLowerCase().includes(term)

    const status = companyStatus(co)
    const matchesStatus = statusFilter.value === 'all' || status === statusFilter.value

    const matchesPackage = packageFilter.value === 'all' || companyPlanId(co) === packageFilter.value

    return matchesSearch && matchesStatus && matchesPackage
  })
})

const statusBadgeClass = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400',
  frozen: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
  at_risk: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
}
</script>

<template>
  <div class="space-y-4"> -->
    <!-- Search & filter bar -->
    <!-- <div
      class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm"
    >
      <div class="relative w-full sm:w-80">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input
          v-model="search"
          type="text"
          placeholder="Search company name, email…"
          class="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-khubrat-goldLight focus:outline-none"
        />
      </div>
      <select
        v-model="statusFilter"
        class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
      >
        <option value="all">All Statuses</option>
        <option value="active">Active Only</option>
        <option value="frozen">Frozen Only</option>
      </select>
      <select
        v-model="packageFilter"
        class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
      >
        <option value="all">All Packages</option>
        <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
      </select>
    </div> -->

    <!-- Table -->
    <!-- <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr
              class="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold"
            >
              <th class="p-4 pl-6">Company Entity</th>
              <th class="p-4">Contact Person</th>
              <th class="p-4">Registration Date</th>
              <th class="p-4">Current Package</th>
              <th class="p-4">Status</th>
              <th class="p-4 text-center">Interventions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            <tr v-if="!filtered.length">
              <td colspan="6" class="text-center p-8 text-slate-400 font-semibold">
                <i class="fa-solid fa-folder-open text-3xl mb-2 block"></i>
                No companies found matching selected parameters.
              </td>
            </tr>
            <tr
              v-for="co in filtered"
              :key="co.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="p-4 pl-6">
                <p class="font-extrabold text-slate-900 dark:text-white">{{ co.name }}</p>
                <span class="text-xs text-slate-400">{{ co.email }}</span>
              </td>
              <td class="p-4">
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-300">{{ companyContact(co) }}</span>
              </td>
              <td class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {{ formatDate(co.created_at) }}
              </td>
              <td class="p-4">
                <span class="px-2.5 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300">
                  {{ companyPackage(co) }}
                </span>
              </td>
              <td class="p-4">
                <span
                  class="px-2.5 py-1 text-[10px] font-black rounded-lg w-fit inline-flex items-center gap-1.5"
                  :class="statusBadgeClass[companyStatus(co)] || statusBadgeClass.active"
                >
                  <i class="fa-solid fa-circle text-[6px]"></i>
                  {{ companyStatus(co) }}
                </span>
              </td>
              <td class="p-4">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    class="px-3 py-1.5 text-xs bg-khubrat-blue/5 hover:bg-khubrat-blue/10 text-khubrat-blue dark:text-khubrat-goldLight dark:bg-slate-700 dark:hover:bg-slate-600 font-bold rounded-lg transition-all"
                    title="View subscription details"
                    @click="emit('view', co)"
                  >
                    <i class="fa-solid fa-eye mr-1"></i> Details
                  </button>
                  <button
                    v-if="companyStatus(co) === 'active'"
                    class="p-2 text-xs bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg transition-all"
                    title="Freeze account"
                    @click="emit('freeze', co)"
                  >
                    <i class="fa-solid fa-snowflake"></i>
                  </button>
                  <button
                    v-else
                    class="p-2 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg transition-all"
                    title="Reactivate account"
                    @click="emit('activate', co)"
                  >
                    <i class="fa-solid fa-circle-check"></i>
                  </button>
                  <button
                    class="p-2 text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg transition-all"
                    title="Delete company"
                    @click="emit('delete', co)"
                  >
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template> -->

<script setup>
import { computed, ref } from 'vue'
import { formatDate } from '@/utils/format'

const props = defineProps({
  companies: { type: Array, default: () => [] },
  plans: { type: Array, default: () => [] }
})

const emit = defineEmits(['view', 'freeze', 'activate', 'delete'])

const search = ref('')
const statusFilter = ref('all')
const packageFilter = ref('all')

function companyStatus(company) {
  // الاعتماد على is_active الواردة في ريسبونس القائمة
  return company.is_active === false ? 'frozen' : 'active'
}

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return props.companies.filter((co) => {
    const matchesSearch =
      !term ||
      co.name?.toLowerCase().includes(term) ||
      co.email?.toLowerCase().includes(term) ||
      co.domain?.toLowerCase().includes(term)

    const status = companyStatus(co)
    const matchesStatus = statusFilter.value === 'all' || status === statusFilter.value

    // مقارنة الباقة المحددة في الفلتر مع اسم الباقة الراجع من الباك اند
    const matchesPackage = packageFilter.value === 'all' || co.plan === packageFilter.value

    return matchesSearch && matchesStatus && matchesPackage
  })
})

const statusBadgeClass = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400',
  frozen: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
}
</script>

<template>
  <div class="space-y-4">
    <!-- Search & filter bar -->
    <div
      class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm"
    >
      <div class="relative w-full sm:w-80">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input
          v-model="search"
          type="text"
          placeholder="Search company name, email, domain…"
          class="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-1 focus:ring-khubrat-goldLight focus:outline-none"
        />
      </div>
      <select
        v-model="statusFilter"
        class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
      >
        <option value="all">All Statuses</option>
        <option value="active">Active Only</option>
        <option value="frozen">Frozen Only</option>
      </select>
      <select
        v-model="packageFilter"
        class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
      >
        <option value="all">All Packages</option>
        <option v-for="plan in plans" :key="plan.id" :value="plan.name || plan.id">{{ plan.name }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr
              class="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold"
            >
              <th class="p-4 pl-6">Company Entity</th>
              <th class="p-4">Domain</th>
              <th class="p-4">Current Package</th>
              <th class="p-4">Plan End Date</th>
              <th class="p-4">Status</th>
              <th class="p-4 text-center">Interventions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
            <tr v-if="!filtered.length">
              <td colspan="6" class="text-center p-8 text-slate-400 font-semibold">
                <i class="fa-solid fa-folder-open text-3xl mb-2 block"></i>
                No companies found matching selected parameters.
              </td>
            </tr>
            <tr
              v-for="co in filtered"
              :key="co.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="p-4 pl-6">
                <p class="font-extrabold text-slate-900 dark:text-white">{{ co.name }}</p>
                <span class="text-xs text-slate-400">{{ co.email }}</span>
              </td>
              <td class="p-4">
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-300">{{ co.domain || '—' }}</span>
              </td>
              <td class="p-4">
                <span class="px-2.5 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300">
                  {{ co.plan || '—' }}
                </span>
              </td>
              <td class="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {{ co.plan_end_date ? formatDate(co.plan_end_date) : '—' }}
              </td>
              <td class="p-4">
                <span
                  class="px-2.5 py-1 text-[10px] font-black rounded-lg w-fit inline-flex items-center gap-1.5"
                  :class="statusBadgeClass[companyStatus(co)] || statusBadgeClass.active"
                >
                  <i class="fa-solid fa-circle text-[6px]"></i>
                  {{ companyStatus(co) }}
                </span>
              </td>
              <td class="p-4">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    class="px-3 py-1.5 text-xs bg-khubrat-blue/5 hover:bg-khubrat-blue/10 text-khubrat-blue dark:text-khubrat-goldLight dark:bg-slate-700 dark:hover:bg-slate-600 font-bold rounded-lg transition-all"
                    title="View subscription details"
                    @click="emit('view', co)"
                  >
                    <i class="fa-solid fa-eye mr-1"></i> Details
                  </button>
                  <button
                    v-if="companyStatus(co) === 'active'"
                    class="p-2 text-xs bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg transition-all"
                    title="Freeze account"
                    @click="emit('freeze', co)"
                  >
                    <i class="fa-solid fa-snowflake"></i>
                  </button>
                  <button
                    v-else
                    class="p-2 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg transition-all"
                    title="Reactivate account"
                    @click="emit('activate', co)"
                  >
                    <i class="fa-solid fa-circle-check"></i>
                  </button>
                  <button
                    class="p-2 text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg transition-all"
                    title="Delete company"
                    @click="emit('delete', co)"
                  >
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<template>
  <div class="p-6 space-y-6" :class="theme === 'dark' ? 'text-gray-100' : ''">
    <!-- Header / Filters -->
    <div class="flex items-center justify-between">
      <!-- <h1 class="text-2xl font-semibold">Payroll Management</h1> -->
      <div class="flex items-center space-x-3">
        <BaseSelect
          v-model="filters.month"
          :options="monthOptions"
          :placeholder="$t('payroll.month')"
          class="w-40"
        />
        <BaseSelect
          v-model="filters.year"
          :options="yearOptions"
          :placeholder="$t('payroll.year')"
          class="w-28"
        />
        <BaseSelect
          v-model="filters.status"
          :options="statusOptions"
          :placeholder="$t('common.status')"
          class="w-40"
        />
        <BaseInput
          v-model="filters.employee_query"
          :placeholder="$t('payroll.searchEmployee')"
          @keyup.enter="fetchSalaries"
          class="w-64"
        />
        <BaseButton @click="fetchSalaries">{{ $t('common.filter') }}</BaseButton>
        <BaseButton variant="outline" @click="generateDrafts">{{ $t('payroll.generateDrafts') }}</BaseButton>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <div class="text-sm text-gray-500 dark:text-gray-300">{{ $t('payroll.totalRecords') }}</div>
        <div class="text-2xl font-semibold">{{ stats.totalRecords }}</div>
      </div>
      <div class="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <div class="text-sm text-gray-500 dark:text-gray-300">{{ $t('payroll.totalNet') }}</div>
        <div class="text-2xl font-semibold">{{ formatCurrency(stats.totalNet) }}</div>
      </div>
      <div class="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <div class="text-sm text-gray-500 dark:text-gray-300">{{ $t('payroll.totalPaid') }}</div>
        <div class="text-2xl font-semibold">{{ formatCurrency(stats.totalPaid) }}</div>
      </div>
      <div class="p-4 bg-white dark:bg-gray-800 rounded shadow">
        <div class="text-sm text-gray-500 dark:text-gray-300">{{ $t('payroll.totalPending') }}</div>
        <div class="text-2xl font-semibold">{{ formatCurrency(stats.totalPending) }}</div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-gray-800 rounded shadow overflow-auto">
      <table class="min-w-full table-auto">
        <thead>
          <tr class="bg-gray-50 dark:bg-gray-900">
            <th class="px-4 py-3 text-start text-sm font-medium">{{ $t('payroll.employee') }}</th>
            <th class="px-4 py-3 text-start text-sm font-medium">{{ $t('payroll.period') }}</th>
            <th class="px-4 py-3 text-end text-sm font-medium">{{ $t('payroll.base') }}</th>
            <th class="px-4 py-3 text-end text-sm font-medium">{{ $t('payroll.additions') }}</th>
            <th class="px-4 py-3 text-end text-sm font-medium">{{ $t('payroll.deductions') }}</th>
            <th class="px-4 py-3 text-end text-sm font-medium">{{ $t('payroll.net') }}</th>
            <th class="px-4 py-3 text-center text-sm font-medium">{{ $t('common.status') }}</th>
            <th class="px-4 py-3 text-end text-sm font-medium">{{ $t('payroll.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in salaries" :key="record.id" class="border-t hover:bg-gray-50 dark:hover:bg-gray-900">
            <td class="px-4 py-3">{{ record.employee_name }}</td>
            <td class="px-4 py-3">{{ record.period }}</td>
            <td class="px-4 py-3 text-end">{{ formatCurrency(record.base_salary) }}</td>
            <!-- Additions (Green) -->
            <td class="px-4 py-3 text-end text-emerald-600 dark:text-emerald-400 font-medium">
              {{ formatCurrency(record.total_additions) }}
            </td>
            <!-- Deductions (Red) -->
            <td class="px-4 py-3 text-end text-rose-600 dark:text-rose-400 font-medium">
              {{ formatCurrency(record.total_deductions) }}
            </td>
            <td class="px-4 py-3 text-end font-semibold">{{ formatCurrency(record.net_salary) }}</td>
            <td class="px-4 py-3 text-center">
              <span
                class="px-2 py-1 rounded text-xs"
                :class="record.is_received ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
              >
                {{ record.is_received ? $t('status.paid') : $t('status.pending') }}
              </span>
            </td>
            <td class="px-4 py-3 text-end">
              <div class="flex items-center justify-end space-x-2">
                <BaseButton size="sm" @click="openDrawer(record)">{{ $t('common.view') }}</BaseButton>
                <BaseButton size="sm" variant="primary" :disabled="record.is_received" @click="markPaid(record)">
                  {{ $t('payroll.markPaid') }}
                </BaseButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination (simple) -->
      <div class="p-4 flex items-center justify-between">
        <div class="text-sm text-gray-500">{{ $t('common.pageOf', { page: pagination.current_page, last: pagination.last_page }) }}</div>
        <div class="space-x-2">
          <BaseButton size="sm" @click="changePage(pagination.current_page - 1)" :disabled="!pagination.prev_page_url">{{ $t('common.previous') }}</BaseButton>
          <BaseButton size="sm" @click="changePage(pagination.current_page + 1)" :disabled="!pagination.next_page_url">{{ $t('common.next') }}</BaseButton>
        </div>
      </div>
    </div>

    <!-- Slide-over drawer -->
    <PayrollDrawer
      v-if="drawer.open"
      :salary-id="drawer.salaryId"
      :on-close="closeDrawer"
      @paid="onDrawerPaid"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import { useSalariesStore } from '@/stores/salaries.store'
import { formatCurrency as formatMoneyValue } from '@/utils/format'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import PayrollDrawer from '@/components/common/PayrollDrawer.vue'

export default {
  components: { BaseInput, BaseSelect, BaseButton, PayrollDrawer },
  setup() {
    const { theme } = useTheme()
    const { t, tm, locale } = useI18n()
    const store = useSalariesStore()

    const filters = ref({
      month: null,
      year: null,
      status: null,
      employee_query: '',
      per_page: 20
    })

    const monthNames = computed(() => {
      void locale.value
      const names = tm('months.long')
      return Array.isArray(names) ? names : []
    })
    const monthOptions = computed(() =>
      monthNames.value.map((label, i) => ({ label, value: i + 1 }))
    )
    const currentYear = new Date().getFullYear()
    const yearOptions = Array.from({ length: 5 }).map((_, i) => ({ label: `${currentYear - i}`, value: currentYear - i }))
    const statusOptions = computed(() => [
      { label: t('common.all'), value: null },
      { label: t('status.paid'), value: 'paid' },
      { label: t('status.draft'), value: 'draft' },
      { label: t('status.pending'), value: 'pending' }
    ])

    const fetchSalaries = async (page = 1) => {
      await store.fetchSalaries({ ...filters.value, page })
    }

    const generateDrafts = async () => {
      const payload = { month: filters.value.month, year: filters.value.year }
      await store.generateDrafts(payload)
      await fetchSalaries()
    }

    const openDrawer = (record) => {
      store.openDrawer(record.id)
    }
    const closeDrawer = () => store.closeDrawer()

    const onDrawerPaid = async () => {
      await fetchSalaries(store.pagination.current_page)
    }

    const markPaid = async (record) => {
      await store.markSalaryPaid(record.id)
      await fetchSalaries(store.pagination.current_page)
    }

    const changePage = (page) => {
      if (page < 1) return
      fetchSalaries(page)
    }

    onMounted(() => {
      fetchSalaries()
    })

    const salaries = computed(() => store.salariesList)
    const pagination = computed(() => store.pagination)
    const drawer = computed(() => ({ open: store.drawerOpen, salaryId: store.drawerId }))
    const stats = computed(() => store.stats)

    const formatCurrency = (v) => {
      if (v == null) return t('common.emDash')
      return formatMoneyValue(v)
    }

    return {
      theme,
      filters,
      monthOptions,
      yearOptions,
      statusOptions,
      fetchSalaries,
      generateDrafts,
      salaries,
      pagination,
      openDrawer,
      closeDrawer,
      onDrawerPaid,
      drawer,
      stats,
      formatCurrency,
      changePage,
      markPaid
    }
  }
}
</script>

<style scoped>
/* Minimal, Tailwind should provide most styles */
</style>
<script setup>
import { onMounted, ref } from 'vue'
import CompaniesTable from '@/components/dashboard/CompaniesTable.vue'
import CompanyDetailModal from '@/components/dashboard/CompanyDetailModal.vue'
import FreezeReasonModal from '@/components/dashboard/FreezeReasonModal.vue'
// import CompanyFormModal from '@/components/dashboard/CompanyFormModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useCompaniesStore } from '@/stores/companies.store'
import { useSubscriptionPlansStore } from '@/stores/subscriptionPlans.store'

const companiesStore = useCompaniesStore()
const plansStore = useSubscriptionPlansStore()

const detailOpen = ref(false)
const detailLoading = ref(false)

const freezeTarget = ref(null)
const freezeLoading = ref(false)

const createOpen = ref(false)
const createLoading = ref(false)

const actionError = ref('')

onMounted(() => {
  companiesStore.fetchCompanies()
  if (!plansStore.plans.length) plansStore.fetchPlans()
})

async function openDetail(company) {
  detailOpen.value = true
  detailLoading.value = true
  try {
    await companiesStore.fetchCompany(company.id)
  } catch (err) {
    actionError.value = err.message
  } finally {
    detailLoading.value = false
  }
}

function closeDetail() {
  detailOpen.value = false
}

function askFreeze(company) {
  freezeTarget.value = company
}

async function confirmFreeze(reason) {
  freezeLoading.value = true
  actionError.value = ''
  try {
    await companiesStore.freezeCompany(freezeTarget.value.id, reason)
    freezeTarget.value = null
    detailOpen.value = false
  } catch (err) {
    actionError.value = err.message
  } finally {
    freezeLoading.value = false
  }
}

async function activate(company) {
  actionError.value = ''
  try {
    await companiesStore.activateCompany(company.id)
    detailOpen.value = false
  } catch (err) {
    actionError.value = err.message
  }
}

function openCreate() {
  createOpen.value = true
}

async function handleCreate(payload) {
  createLoading.value = true
  actionError.value = ''
  try {
    await companiesStore.registerCompany(payload)
    createOpen.value = false
    await companiesStore.fetchCompanies()
  } catch (err) {
    actionError.value = err.message
  } finally {
    createLoading.value = false
  }
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-khubrat-blue dark:text-white">{{ $t('dashboard.companiesTitle') }}</h3>
        <p class="text-xs text-slate-400">
          {{ $t('dashboard.companiesSubtitle') }}
        </p>
      </div>
    </div>

    <BaseAlert v-if="actionError" variant="error">{{ actionError }}</BaseAlert>

    <LoadingSpinner v-if="companiesStore.loading && !companiesStore.companies.length" :label="$t('dashboard.loadingCompanies')" />

    <BaseAlert v-else-if="companiesStore.error && !companiesStore.companies.length" variant="error">
      {{ companiesStore.error }}
    </BaseAlert>

    <CompaniesTable
      v-else
      :companies="companiesStore.companies"
      :plans="plansStore.plans"
      @view="openDetail"
      @freeze="askFreeze"
      @activate="activate"
    />

    <CompanyDetailModal
      v-if="detailOpen"
      :loading="detailLoading"
      :detail="companiesStore.currentCompany"
      @close="closeDetail"
      @freeze="askFreeze"
      @activate="activate"
    />

    <FreezeReasonModal
      v-if="freezeTarget"
      :loading="freezeLoading"
      @confirm="confirmFreeze"
      @cancel="freezeTarget = null"
    />

    <CompanyFormModal
      v-if="createOpen"
      :loading="createLoading"
      :plans="plansStore.plans"
      @save="handleCreate"
      @cancel="createOpen = false"
    />
  </section>
</template>

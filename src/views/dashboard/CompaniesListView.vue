<script setup>
import { onMounted, ref } from 'vue'
import CompaniesTable from '@/components/dashboard/CompaniesTable.vue'
import CompanyDetailModal from '@/components/dashboard/CompanyDetailModal.vue'
import FreezeReasonModal from '@/components/dashboard/FreezeReasonModal.vue'
import DeleteBlockedModal from '@/components/dashboard/DeleteBlockedModal.vue'
// import CompanyFormModal from '@/components/dashboard/CompanyFormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
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

const deleteTarget = ref(null)
const deleteLoading = ref(false)
const deleteBlocked = ref(null)

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

function askDelete(company) {
  deleteTarget.value = company
}

// الباك اند يرفض حذف شركة لها سجلات مرتبطة (موظفون، رواتب، طلبات…) — نميّز
// هذا الرفض عن أخطاء الشبكة/الصلاحيات لنقترح على المدير التجميد بدلاً من الحذف.
const CONFLICT_STATUSES = [400, 409, 422]

function isActivityConflict(err) {
  if (CONFLICT_STATUSES.includes(err?.status)) return true
  // قيود المفاتيح الأجنبية قد تصل كخطأ 500 برسالة قاعدة البيانات
  return /constraint|foreign key|integrity|cannot be deleted|has (employees|records|activity)/i.test(
    err?.message || ''
  )
}

async function confirmDelete() {
  const target = deleteTarget.value
  deleteLoading.value = true
  actionError.value = ''
  try {
    await companiesStore.removeCompany(target.id)
    deleteTarget.value = null
  } catch (err) {
    deleteTarget.value = null
    if (isActivityConflict(err)) {
      deleteBlocked.value = { company: target, message: err.message }
    } else {
      actionError.value = err.message
    }
  } finally {
    deleteLoading.value = false
  }
}

function freezeInsteadOfDelete() {
  const company = deleteBlocked.value?.company
  deleteBlocked.value = null
  if (company) askFreeze(company)
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
        <h3 class="text-lg font-bold text-khubrat-blue dark:text-white">Subscribed Business Entities</h3>
        <p class="text-xs text-slate-400">
          Inspect payments, active contracts, subscription logs, freeze and manage individual corporate users
        </p>
      </div>
    </div>

    <BaseAlert v-if="actionError" variant="error">{{ actionError }}</BaseAlert>

    <LoadingSpinner v-if="companiesStore.loading && !companiesStore.companies.length" label="Loading companies…" />

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
      @delete="askDelete"
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

    <ConfirmModal
      v-if="deleteTarget"
      title="Delete Company"
      confirm-label="Delete Permanently"
      confirm-variant="danger"
      :loading="deleteLoading"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300">
        This will permanently delete <strong>{{ deleteTarget?.name }}</strong> and cannot be undone. Are you sure?
      </p>
    </ConfirmModal>

    <DeleteBlockedModal
      v-if="deleteBlocked"
      :company-name="deleteBlocked.company?.name"
      :details="deleteBlocked.message"
      :can-freeze="deleteBlocked.company?.is_active !== false"
      @freeze="freezeInsteadOfDelete"
      @cancel="deleteBlocked = null"
    />
  </section>
</template>
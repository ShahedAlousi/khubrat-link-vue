<script setup>
import { onMounted, ref } from 'vue'
import PackageCard from '@/components/dashboard/PackageCard.vue'
import PackageFormModal from '@/components/dashboard/PackageFormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useSubscriptionPlansStore } from '@/stores/subscriptionPlans.store'

const plansStore = useSubscriptionPlansStore()

const formOpen = ref(false)
const editingPlan = ref(null) // null => create mode
const formLoading = ref(false)

const deleteTarget = ref(null)
const deleteLoading = ref(false)

const actionError = ref('')

onMounted(() => {
  plansStore.fetchAllPlans()
})

function openCreate() {
  editingPlan.value = null
  formOpen.value = true
}

function openEdit(plan) {
  editingPlan.value = plan
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingPlan.value = null
}

async function handleSave(payload) {
  formLoading.value = true
  actionError.value = ''
  try {
    if (editingPlan.value) {
      await plansStore.updatePlan(editingPlan.value.id, payload)
    } else {
      await plansStore.createPlan(payload)
    }
    closeForm()
  } catch (err) {
    actionError.value = err.message
  } finally {
    formLoading.value = false
  }
}

async function handleToggle(plan) {
  actionError.value = ''
  try {
    await plansStore.togglePlanStatus(plan)
  } catch (err) {
    actionError.value = err.message
  }
}

function askDelete(plan) {
  deleteTarget.value = plan
}

async function confirmDelete() {
  deleteLoading.value = true
  actionError.value = ''
  try {
    await plansStore.removePlan(deleteTarget.value.id)
    deleteTarget.value = null
  } catch (err) {
    actionError.value = err.message
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-khubrat-blue dark:text-white">Active Subscription Packages</h3>
        <p class="text-xs text-slate-400">
          Configure parameters, pricing limits, and user seats constraints for the SaaS sales model
        </p>
      </div>
      <BaseButton variant="blue" @click="openCreate">
        <i class="fa-solid fa-plus"></i>
        Create New Package
      </BaseButton>
    </div>

    <BaseAlert v-if="actionError" variant="error">{{ actionError }}</BaseAlert>

    <LoadingSpinner v-if="plansStore.loading && !plansStore.plans.length" label="Loading packages…" />

    <BaseAlert v-else-if="plansStore.error && !plansStore.plans.length" variant="error">
      {{ plansStore.error }}
    </BaseAlert>

    <div v-else-if="!plansStore.plans.length" class="text-center text-sm text-slate-400 py-16">
      <i class="fa-solid fa-cubes text-3xl mb-3 block"></i>
      No packages yet. Create your first subscription plan to get started.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <PackageCard
        v-for="plan in plansStore.plans"
        :key="plan.id"
        :plan="plan"
        @edit="openEdit"
        @delete="askDelete"
        @toggle="handleToggle"
      />
    </div>

    <PackageFormModal v-if="formOpen" :plan="editingPlan" :loading="formLoading" @save="handleSave" @cancel="closeForm" />

    <ConfirmModal
      v-if="deleteTarget"
      title="Delete Package Plan"
      confirm-label="Delete Permanently"
      confirm-variant="danger"
      :loading="deleteLoading"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Permanently delete <strong>{{ deleteTarget?.name }}</strong
        >? Existing subscribers won't be deleted but will need to be reassigned to another plan.
      </p>
    </ConfirmModal>
  </section>
</template>
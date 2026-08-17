<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useStaffStore, STAFF_TYPE } from '@/stores/staff.store'
import { HR_DEPARTMENT_NAME } from '@/stores/hrManagers.store'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import StaffProfileDrawer from '@/components/staff/StaffProfileDrawer.vue'
import StaffFormDrawer from '@/components/staff/StaffFormDrawer.vue'
import { formatCurrency, formatDate } from '@/utils/format'

const authStore = useAuthStore()
const staffStore = useStaffStore()

const search = ref('')
const profileOpen = ref(false)
const formOpen = ref(false)
const formMode = ref('create')
const formStaffType = ref(STAFF_TYPE.REGULAR)
const formInitial = ref(null)
const formDrawerRef = ref(null)

const deleteTarget = ref(null)
const deleteConfirmOpen = ref(false)
const freezeOfferOpen = ref(false)
const freezeOfferMessage = ref('')
const flash = ref('')

const canModifyDirectory = computed(
  () => authStore.isGeneralManager || authStore.isHrManager
)
const tableColumnCount = computed(
  () => 6 + (authStore.isGeneralManager ? 1 : 0) + (canModifyDirectory.value ? 1 : 0)
)

const addLabel = computed(() =>
  authStore.isGeneralManager ? '+ Add HR Staff' : '+ Add Employee'
)

const filteredStaff = computed(() => {
  const q = search.value.trim().toLowerCase()
  const rows = staffStore.sortedStaff
  if (!q) return rows
  return rows.filter((row) => {
    const haystack = [row.full_name, row.email, row.job_title, departmentLabel(row), row.staffType]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

onMounted(async () => {
  try {
    if (authStore.isDepartmentManager) {
      await staffStore.fetchDirectory()
    } else {
      await Promise.all([staffStore.fetchDirectory(), staffStore.fetchDepartments()])
    }
  } catch {
    // error surfaced via store.error
  }
})

async function openProfile(row) {
  profileOpen.value = true
  try {
    await staffStore.fetchDetail(row)
  } catch {
    // keep drawer open to show error state via alert below
  }
}

function closeProfile() {
  profileOpen.value = false
  staffStore.clearSelected()
}

function openCreate() {
  formMode.value = 'create'
  formStaffType.value = authStore.isGeneralManager ? STAFF_TYPE.HR : STAFF_TYPE.REGULAR
  formInitial.value = null
  formOpen.value = true
}

function openEdit() {
  const profile = staffStore.selected
  if (!profile || !staffStore.canManage(profile)) return
  formMode.value = 'edit'
  formStaffType.value = profile.staffType
  formInitial.value = { ...profile }
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
}

async function handleFormSubmit(form) {
  try {
    if (formMode.value === 'edit' && formInitial.value) {
      await staffStore.updateStaff(formInitial.value, form)
      flash.value = 'Profile updated successfully.'
    } else {
      await staffStore.createStaff(formStaffType.value, form)
      flash.value = formStaffType.value === STAFF_TYPE.HR
        ? 'HR staff member created successfully.'
        : 'Employee created successfully.'
    }
    formOpen.value = false
    if (profileOpen.value && staffStore.selected) {
      await staffStore.fetchDetail(staffStore.selected)
    }
  } catch (err) {
    formDrawerRef.value?.setServerError(err.message, err.errors)
  }
}

function askDelete(row) {
  deleteTarget.value = row || staffStore.selected
  if (!deleteTarget.value) return
  deleteConfirmOpen.value = true
}

async function confirmDelete() {
  const target = deleteTarget.value
  if (!target) return
  try {
    const result = await staffStore.deleteStaff(target)
    deleteConfirmOpen.value = false

    if (result.status === 'deleted') {
      flash.value = 'Record permanently deleted.'
      deleteTarget.value = null
      if (profileOpen.value && !staffStore.selected) profileOpen.value = false
      return
    }

    if (result.status === 'blocked') {
      freezeOfferMessage.value =
        result.message ||
        'Permanent deletion is not available because this person has related records in the system.'
      freezeOfferOpen.value = true
    }
  } catch {
    deleteConfirmOpen.value = false
  }
}

async function confirmFreezeInstead() {
  const target = deleteTarget.value
  if (!target) return
  try {
    await staffStore.freezeStaff(target)
    freezeOfferOpen.value = false
    deleteTarget.value = null
    flash.value = 'Account frozen successfully. Permanent deletion was not possible.'
  } catch {
    // store.error
  }
}

function cancelFreezeOffer() {
  freezeOfferOpen.value = false
  deleteTarget.value = null
}

async function handleFreeze() {
  const profile = staffStore.selected
  if (!profile) return
  try {
    await staffStore.freezeStaff(profile)
    flash.value = 'Account deactivated successfully.'
  } catch {
    // store.error
  }
}

async function handleActivate() {
  const profile = staffStore.selected
  if (!profile) return
  try {
    await staffStore.activateStaff(profile)
    flash.value = 'Account activated successfully.'
  } catch {
    // store.error
  }
}

function roleBadgeClass(staffType) {
  return staffType === STAFF_TYPE.HR
    ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300'
    : 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
}

function departmentLabel(row) {
  if (row.staffType === STAFF_TYPE.HR) return HR_DEPARTMENT_NAME
  return row.department_name || '—'
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h3 class="text-lg font-bold text-khubrat-blue dark:text-white">Staff Directory</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          <template v-if="authStore.isGeneralManager">
            Viewing employees and HR staff. You can manage HR staff only.
          </template>
          <template v-else-if="authStore.isDepartmentManager">
            Viewing employees in your department. Profiles are read-only.
          </template>
          <template v-else>
            Viewing regular employees. You can add, edit, freeze, or delete employees.
          </template>
        </p>
      </div>

      <BaseButton
        v-if="canModifyDirectory"
        variant="gold"
        @click="openCreate"
      >
        {{ addLabel }}
      </BaseButton>
    </div>

    <BaseAlert v-if="flash" variant="success">
      {{ flash }}
      <button class="ml-2 underline text-xs" @click="flash = ''">Dismiss</button>
    </BaseAlert>
    <BaseAlert v-if="staffStore.error" variant="error">{{ staffStore.error }}</BaseAlert>

    <div class="max-w-sm">
      <BaseInput v-model="search" placeholder="Search by name, title, or department…" />
    </div>

    <LoadingSpinner v-if="staffStore.loading" />

    <div
      v-else
      class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3 font-bold">Name</th>
              <th v-if="authStore.isGeneralManager" class="px-4 py-3 font-bold">Role</th>
              <th class="px-4 py-3 font-bold">Department</th>
              <th class="px-4 py-3 font-bold">Job Title</th>
              <th class="px-4 py-3 font-bold">Start Date</th>
              <th class="px-4 py-3 font-bold">Base Salary</th>
              <th class="px-4 py-3 font-bold">Status</th>
              <th v-if="canModifyDirectory" class="px-4 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filteredStaff.length">
              <td :colspan="tableColumnCount" class="px-4 py-10 text-center text-slate-400">
                No staff records found.
              </td>
            </tr>
            <tr
              v-for="row in filteredStaff"
              :key="`${row.staffType}-${row.id}`"
              class="border-t border-slate-100 dark:border-slate-700
               hover:bg-slate-200/70 dark:hover:bg-slate-900/40 
               cursor-pointer transition-colors"
              @click="openProfile(row)"
            >
              <td class="px-4 py-3">
                <p class="font-bold text-khubrat-blue dark:text-white">{{ row.full_name || '—' }}</p>
                <p class="text-[11px] text-slate-400">{{ row.email }}</p>
              </td>
              <td v-if="authStore.isGeneralManager" class="px-4 py-3">
                <span
                  class="inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold"
                  :class="roleBadgeClass(row.staffType)"
                >
                  {{ row.staffType === STAFF_TYPE.HR ? 'HR' : 'Employee' }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ departmentLabel(row) }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ row.job_title || '—' }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ formatDate(row.hire_date) }}</td>
              <td class="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                {{ formatCurrency(row.base_salary) }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold"
                  :class="
                    row.is_active
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800/40 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  "
                >
                  {{ row.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td v-if="canModifyDirectory" class="px-4 py-3 text-right" @click.stop>
                <button
                  v-if="staffStore.canManage(row)"
                  class="text-slate-400 hover:text-rose-500 p-2 rounded-lg transition-colors"
                  title="Delete"
                  @click="askDelete(row)"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <StaffProfileDrawer
      :open="profileOpen"
      :profile="staffStore.selected"
      :loading="staffStore.detailLoading"
      :can-manage="staffStore.canManage(staffStore.selected)"
      :action-loading="staffStore.saving || staffStore.deleting"
      @close="closeProfile"
      @edit="openEdit"
      @delete="askDelete(staffStore.selected)"
      @freeze="handleFreeze"
      @activate="handleActivate"
    />

    <StaffFormDrawer
      v-if="canModifyDirectory"
      ref="formDrawerRef"
      :open="formOpen"
      :mode="formMode"
      :staff-type="formStaffType"
      :initial="formInitial"
      :departments="staffStore.departments"
      :saving="staffStore.saving"
      @close="closeForm"
      @submit="handleFormSubmit"
    />

    <ConfirmModal
      v-if="canModifyDirectory && deleteConfirmOpen"
      title="Delete Permanently"
      confirm-label="Yes, Delete"
      confirm-variant="danger"
      :loading="staffStore.deleting"
      @confirm="confirmDelete"
      @cancel="deleteConfirmOpen = false; deleteTarget = null"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300">
        This will permanently delete
        <strong>{{ deleteTarget?.full_name }}</strong>
        and their linked user account. Are you sure?
      </p>
    </ConfirmModal>

    <ConfirmModal
      v-if="canModifyDirectory && freezeOfferOpen"
      title="Deletion Not Available"
      confirm-label="Freeze Instead"
      confirm-variant="blue"
      :loading="staffStore.saving"
      @confirm="confirmFreezeInstead"
      @cancel="cancelFreezeOffer"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-2">{{ freezeOfferMessage }}</p>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Would you like to freeze this account instead, or cancel the action?
      </p>
    </ConfirmModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useDepartmentsStore } from '@/stores/department.store'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DepartmentFormDrawer from '@/components/staff/DepartmentFormDrawer.vue'

const authStore = useAuthStore()
const departmentsStore = useDepartmentsStore()

const search = ref('')
const formOpen = ref(false)
const formMode = ref('create')
const formInitial = ref(null)
const formDrawerRef = ref(null)

const deleteTarget = ref(null)
const deleteConfirmOpen = ref(false)
const blockedMessage = ref('')
const blockedOpen = ref(false)
const flash = ref('')

const canManage = computed(() => authStore.isHrManager)

const filteredDepartments = computed(() => {
  const q = search.value.trim().toLowerCase()
  const rows = departmentsStore.sortedDepartments
  if (!q) return rows
  return rows.filter((row) => {
    const haystack = [row.name, row.manager_name, row.is_active ? 'active' : 'inactive']
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

onMounted(async () => {
  try {
    await departmentsStore.fetchDepartments()
  } catch {
    // surfaced via store.error
  }
})

function openCreate() {
  formMode.value = 'create'
  formInitial.value = null
  departmentsStore.clearDepartmentEmployees()
  formOpen.value = true
}

async function openEdit(row) {
  formMode.value = 'edit'
  formInitial.value = { ...row }
  formOpen.value = true
  try {
    await departmentsStore.fetchDepartmentEmployees(row.id)
  } catch {
    // form still usable without manager list
  }
}

function closeForm() {
  formOpen.value = false
  formInitial.value = null
  departmentsStore.clearDepartmentEmployees()
}

async function handleFormSubmit(form) {
  try {
    if (formMode.value === 'edit' && formInitial.value?.id) {
      await departmentsStore.updateDepartment(formInitial.value.id, form)
      flash.value = 'Department updated successfully.'
    } else {
      await departmentsStore.createDepartment(form)
      flash.value = 'Department created successfully. Add employees, then assign a manager.'
    }
    formOpen.value = false
    formInitial.value = null
    departmentsStore.clearDepartmentEmployees()
  } catch (err) {
    formDrawerRef.value?.setServerError(err.message, err.errors)
  }
}

function askDelete(row) {
  deleteTarget.value = row
  deleteConfirmOpen.value = true
}

async function confirmDelete() {
  const target = deleteTarget.value
  if (!target) return
  try {
    const result = await departmentsStore.deleteDepartment(target.id)
    deleteConfirmOpen.value = false

    if (result.status === 'deleted') {
      flash.value = 'Department deleted successfully.'
      deleteTarget.value = null
      return
    }

    if (result.status === 'blocked') {
      blockedMessage.value =
        result.message ||
        'The department must be free of employees before deletion. Reassign employees via Employee Management first.'
      blockedOpen.value = true
    }
  } catch {
    deleteConfirmOpen.value = false
  }
}

function closeBlocked() {
  blockedOpen.value = false
  deleteTarget.value = null
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h3 class="text-lg font-bold text-khubrat-blue dark:text-white">Departments</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          <template v-if="canManage">
            Create departments, assign managers from department employees, and manage status.
          </template>
          <template v-else>
            View company departments, their status, and assigned managers.
          </template>
        </p>
      </div>

      <BaseButton v-if="canManage" variant="gold" @click="openCreate">
        + Add Department
      </BaseButton>
    </div>

    <BaseAlert v-if="flash" variant="success">
      {{ flash }}
      <button class="ml-2 underline text-xs" @click="flash = ''">Dismiss</button>
    </BaseAlert>
    <BaseAlert v-if="departmentsStore.error" variant="error">{{ departmentsStore.error }}</BaseAlert>

    <div class="max-w-sm">
      <BaseInput v-model="search" placeholder="Search departments or managers…" />
    </div>

    <LoadingSpinner v-if="departmentsStore.loading" />

    <div
      v-else
      class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3 font-bold">Department</th>
              <th class="px-4 py-3 font-bold">Manager</th>
              <th class="px-4 py-3 font-bold">Status</th>
              <th v-if="canManage" class="px-4 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filteredDepartments.length">
              <td :colspan="canManage ? 4 : 3" class="px-4 py-10 text-center text-slate-400">
                No departments found.
              </td>
            </tr>
            <tr
              v-for="row in filteredDepartments"
              :key="row.id"
              class="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
            >
              <td class="px-4 py-3">
                <p class="font-bold text-khubrat-blue dark:text-white">{{ row.name }}</p>
              </td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">
                <template v-if="row.manager_name">{{ row.manager_name }}</template>
                <span v-else class="text-slate-400 italic">Not assigned</span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold"
                  :class="
                    row.is_active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500'
                  "
                >
                  {{ row.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td v-if="canManage" class="px-4 py-3 text-right whitespace-nowrap">
                <button
                  class="text-slate-400 hover:text-khubrat-blue dark:hover:text-khubrat-goldLight p-2 rounded-lg transition-colors"
                  title="Edit"
                  @click="openEdit(row)"
                >
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button
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

    <DepartmentFormDrawer
      ref="formDrawerRef"
      :open="formOpen"
      :mode="formMode"
      :initial="formInitial"
      :employee-options="departmentsStore.employeeOptions"
      :employees-loading="departmentsStore.employeesLoading"
      :saving="departmentsStore.saving"
      @close="closeForm"
      @submit="handleFormSubmit"
    />

    <ConfirmModal
      v-if="deleteConfirmOpen"
      title="Delete Department"
      confirm-label="Yes, Delete"
      confirm-variant="danger"
      :loading="departmentsStore.deleting"
      @confirm="confirmDelete"
      @cancel="deleteConfirmOpen = false; deleteTarget = null"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-2">
        You are about to permanently delete
        <strong>{{ deleteTarget?.name }}</strong>.
      </p>
      <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        The department must be free of employees before deletion. Reassign employees via Employee
        Management first.
      </p>
    </ConfirmModal>

    <ConfirmModal
      v-if="blockedOpen"
      title="Cannot Delete Department"
      confirm-label="Got It"
      confirm-variant="blue"
      @confirm="closeBlocked"
      @cancel="closeBlocked"
    >
      <p class="text-sm text-slate-600 dark:text-slate-300">{{ blockedMessage }}</p>
    </ConfirmModal>
  </div>
</template>

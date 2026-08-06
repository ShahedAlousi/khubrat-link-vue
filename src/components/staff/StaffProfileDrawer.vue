<script setup>
import { computed } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { STAFF_TYPE } from '@/stores/staff.store'
import { formatCurrency, formatDate } from '@/utils/format'

const props = defineProps({
  open: { type: Boolean, default: false },
  profile: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  canManage: { type: Boolean, default: false },
  actionLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'edit', 'delete', 'freeze', 'activate'])

const roleLabel = computed(() =>
  props.profile?.staffType === STAFF_TYPE.HR ? 'HR Staff' : 'Employee'
)

function display(value) {
  return value === null || value === undefined || value === '' ? '—' : value
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex">
    <div class="fixed inset-0 bg-black/40" @click="emit('close')" />

    <aside
      class="ml-auto relative w-full max-w-lg bg-white dark:bg-slate-800 h-full shadow-2xl overflow-y-auto border-l border-slate-200 dark:border-slate-700"
    >
      <div class="sticky top-0 z-10 bg-khubrat-blue text-white px-6 py-5 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[11px] uppercase tracking-wide text-khubrat-goldLight/80 font-bold">{{ roleLabel }}</p>
          <h3 class="text-lg font-bold text-khubrat-goldLight truncate">
            {{ profile?.full_name || 'Staff Profile' }}
          </h3>
          <p class="text-xs text-white/60 truncate">{{ profile?.email }}</p>
        </div>
        <button class="text-white/70 hover:text-white shrink-0" @click="emit('close')">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div class="p-6">
        <LoadingSpinner v-if="loading" />

        <template v-else-if="profile">
          <div class="flex flex-wrap gap-2 mb-6">
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold"
              :class="
                profile.is_active
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
              "
            >
              {{ profile.is_active ? 'Active' : 'Inactive' }}
            </span>
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold"
              :class="
                profile.staffType === STAFF_TYPE.HR
                  ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                  : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
              "
            >
              {{ roleLabel }}
            </span>
          </div>

          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">Department</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ display(profile.department_name) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">Job Title</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ display(profile.job_title) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">Hire Date</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ formatDate(profile.hire_date) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">Base Salary</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ formatCurrency(profile.base_salary) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">Phone</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">{{ display(profile.phone) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">Employment Type</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ display(profile.employment_type) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">Education</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ display(profile.education) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">Gender</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5 capitalize">
                {{ display(profile.gender) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">Marital Status</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5 capitalize">
                {{ display(profile.marital_status) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">Nationality</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ display(profile.nationality) }}
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs font-bold text-slate-400 uppercase">Residence</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ display(profile.residence) }}
              </dd>
            </div>
          </dl>

          <div v-if="canManage" class="mt-8 flex flex-wrap gap-2 border-t border-slate-200 dark:border-slate-700 pt-5">
            <BaseButton variant="blue" :disabled="actionLoading" @click="emit('edit')">
              <i class="fa-solid fa-pen"></i> Edit
            </BaseButton>
            <BaseButton
              v-if="profile.is_active"
              variant="ghost"
              :loading="actionLoading"
              @click="emit('freeze')"
            >
              <i class="fa-solid fa-snowflake"></i> Freeze / Deactivate
            </BaseButton>
            <BaseButton
              v-else
              variant="gold"
              :loading="actionLoading"
              @click="emit('activate')"
            >
              <i class="fa-solid fa-play"></i> Activate
            </BaseButton>
            <BaseButton variant="danger" :disabled="actionLoading" @click="emit('delete')">
              <i class="fa-solid fa-trash"></i> Delete
            </BaseButton>
          </div>

          <p v-else class="mt-8 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-4">
            This profile is read-only for your role.
          </p>
        </template>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { STAFF_TYPE } from '@/stores/staff.store'
import { formatCurrency, formatDate } from '@/utils/format'
import { translateStatus } from '@/i18n/helpers'

const props = defineProps({
  open: { type: Boolean, default: false },
  profile: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  canManage: { type: Boolean, default: false },
  actionLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'edit', 'delete', 'freeze', 'activate'])

const { t } = useI18n()

const roleLabel = computed(() =>
  props.profile?.staffType === STAFF_TYPE.HR ? t('staff.hrStaff') : t('staff.employee')
)

function display(value) {
  return value === null || value === undefined || value === '' ? t('common.emDash') : value
}

function departmentDisplay(profile) {
  if (profile?.staffType === STAFF_TYPE.HR) return t('staff.humanResources')
  return display(profile?.department_name)
}

function translateEmployment(value) {
  const map = {
    'full-time': 'staff.fullTime',
    'part-time': 'staff.partTime',
    contract: 'staff.contract'
  }
  return map[value] ? t(map[value]) : display(value)
}

function translateGender(value) {
  const map = { male: 'staff.male', female: 'staff.female', unspecified: 'staff.unspecified' }
  return map[value] ? t(map[value]) : display(value)
}

function translateMarital(value) {
  const map = {
    single: 'staff.single',
    married: 'staff.married',
    divorced: 'staff.divorced',
    widowed: 'staff.widowed'
  }
  return map[value] ? t(map[value]) : display(value)
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex">
    <div class="fixed inset-0 bg-black/40" @click="emit('close')" />

    <aside
      class="ms-auto relative w-full max-w-lg bg-white dark:bg-slate-800 h-full shadow-2xl overflow-y-auto border-s border-slate-200 dark:border-slate-700"
    >
      <div class="sticky top-0 z-10 bg-khubrat-blue text-white px-6 py-5 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[11px] uppercase tracking-wide text-khubrat-goldLight/80 font-bold">{{ roleLabel }}</p>
          <h3 class="text-lg font-bold text-khubrat-goldLight truncate">
            {{ profile?.full_name || $t('staff.staffProfile') }}
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
              {{ translateStatus(profile.is_active ? 'active' : 'inactive') }}
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
              <dt class="text-xs font-bold text-slate-400 uppercase">{{ $t('staff.department') }}</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ departmentDisplay(profile) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">{{ $t('staff.jobTitle') }}</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ display(profile.job_title) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">{{ $t('staff.hireDate') }}</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ formatDate(profile.hire_date) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">{{ $t('staff.birthDate') }}</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ formatDate(profile.birth_date) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">{{ $t('staff.baseSalary') }}</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ formatCurrency(profile.base_salary) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">{{ $t('staff.phone') }}</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">{{ display(profile.phone) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">{{ $t('staff.employmentType') }}</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ translateEmployment(profile.employment_type) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">{{ $t('staff.education') }}</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ display(profile.education) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">{{ $t('staff.gender') }}</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ translateGender(profile.gender) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">{{ $t('staff.maritalStatus') }}</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ translateMarital(profile.marital_status) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-bold text-slate-400 uppercase">{{ $t('staff.nationality') }}</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ display(profile.nationality) }}
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs font-bold text-slate-400 uppercase">{{ $t('staff.residence') }}</dt>
              <dd class="font-semibold text-khubrat-blue dark:text-white mt-0.5">
                {{ display(profile.residence) }}
              </dd>
            </div>
          </dl>

          <div v-if="canManage" class="mt-8 flex flex-wrap gap-2 border-t border-slate-200 dark:border-slate-700 pt-5">
            <BaseButton variant="blue" :disabled="actionLoading" @click="emit('edit')">
              <i class="fa-solid fa-pen"></i> {{ $t('common.edit') }}
            </BaseButton>
            <BaseButton
              v-if="profile.is_active"
              variant="ghost"
              :loading="actionLoading"
              @click="emit('freeze')"
            >
              <i class="fa-solid fa-snowflake"></i> {{ $t('staff.freeze') }} / {{ $t('staff.deactivate') }}
            </BaseButton>
            <BaseButton
              v-else
              variant="gold"
              :loading="actionLoading"
              @click="emit('activate')"
            >
              <i class="fa-solid fa-play"></i> {{ $t('staff.activate') }}
            </BaseButton>
            <BaseButton variant="danger" :disabled="actionLoading" @click="emit('delete')">
              <i class="fa-solid fa-trash"></i> {{ $t('common.delete') }}
            </BaseButton>
          </div>

          <p v-else class="mt-8 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-4">
            {{ $t('staff.readOnlyRole') }}
          </p>
        </template>
      </div>
    </aside>
  </div>
</template>

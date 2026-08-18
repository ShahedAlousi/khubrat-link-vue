<script setup>
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import ToggleSwitch from '@/components/policies/ToggleSwitch.vue'
import { STAFF_TYPE } from '@/stores/staff.store'
import { useDepartmentsStore } from '@/stores/department.store'
import { isRequired, isValidEmail, isValidPhone, isValidHireDate, isValidBirthDate } from '@/utils/validators'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // create | edit
  staffType: { type: String, default: STAFF_TYPE.REGULAR },
  initial: { type: Object, default: null },
  departments: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false }
})

const { t } = useI18n()
const emit = defineEmits(['close', 'submit'])

const departmentsStore = useDepartmentsStore()

const form = reactive(emptyForm())
const fieldErrors = reactive({})
const formError = reactive({ message: '' })

const title = computed(() => {
  if (props.staffType === STAFF_TYPE.HR) {
    return props.mode === 'edit' ? t('staff.editHrTitle') : t('staff.addHrTitle')
  }
  return props.mode === 'edit' ? t('staff.editEmployeeTitle') : t('staff.addEmployeeTitle')
})

// The prop holds the list the parent loaded when the page opened; once the
// dropdown is clicked the store becomes the fresher source of truth.
const departmentOptions = computed(() => {
  const source = departmentsStore.departments.length
    ? departmentsStore.sortedDepartments
    : props.departments
  return source.map((d) => ({ value: d.id, label: d.name }))
})

async function refreshDepartments() {
  if (departmentsStore.loading) return
  try {
    await departmentsStore.fetchDepartments({ is_active: true })
  } catch {
    // Keep the currently rendered options; the store exposes the error.
  }
}

const genderOptions = computed(() => [
  { value: 'male', label: t('staff.male') },
  { value: 'female', label: t('staff.female') }
])

const maritalOptions = computed(() => [
  { value: 'single', label: t('staff.single') },
  { value: 'married', label: t('staff.married') },
  { value: 'divorced', label: t('staff.divorced') },
  { value: 'widowed', label: t('staff.widowed') }
])

const employmentOptions = computed(() => [
  { value: 'full-time', label: t('staff.fullTime') },
  { value: 'part-time', label: t('staff.partTime') },
  { value: 'contract', label: t('staff.contract') }
])

function emptyForm() {
  return {
    full_name: '',
    email: '',
    phone: '',
    department_id: '',
    education: '',
    job_title: '',
    base_salary: '',
    hire_date: '',
    birth_date: '',
    employment_type: 'full-time',
    is_active: true,
    gender: '',
    marital_status: '',
    nationality: '',
    residence: ''
  }
}

function fillFromInitial(row) {
  Object.assign(form, emptyForm(), {
    full_name: row?.full_name ?? '',
    email: row?.email ?? '',
    phone: row?.phone ?? '',
    department_id: row?.department_id ?? '',
    education: row?.education ?? '',
    job_title: row?.job_title ?? '',
    base_salary: row?.base_salary ?? '',
    hire_date: row?.hire_date ? String(row.hire_date).slice(0, 10) : '',
    birth_date: row?.birth_date ? String(row.birth_date).slice(0, 10) : '',
    employment_type: row?.employment_type || 'full-time',
    is_active: row?.is_active ?? true,
    gender: row?.gender ?? '',
    marital_status: row?.marital_status ?? '',
    nationality: row?.nationality ?? '',
    residence: row?.residence ?? ''
  })
}

watch(
  () => [props.open, props.initial, props.mode],
  () => {
    formError.message = ''
    Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
    if (props.mode === 'edit' && props.initial) fillFromInitial(props.initial)
    else Object.assign(form, emptyForm())
  },
  { immediate: true }
)

function validate() {
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])

  if (!isRequired(form.full_name)) fieldErrors.full_name = t('validation.fullNameRequired')
  if (!isValidEmail(form.email)) fieldErrors.email = t('validation.email')
  if (!isRequired(form.department_id)) fieldErrors.department_id = t('validation.departmentRequired')
  if (!isRequired(form.job_title)) fieldErrors.job_title = t('validation.jobTitleRequired')
  if (!isRequired(form.base_salary) || Number(form.base_salary) < 0) {
    fieldErrors.base_salary = t('validation.salaryRequired')
  }
  if (!isValidHireDate(form.hire_date)) {
    fieldErrors.hire_date = t('validation.hireDateInvalid')
  }
  if (!isValidBirthDate(form.birth_date)) {
    fieldErrors.birth_date = t('validation.birthDateInvalid')
  }
  if (form.phone && !isValidPhone(form.phone)) {
    fieldErrors.phone = t('validation.phoneFormat')
  }

  return Object.keys(fieldErrors).length === 0
}

function handleSubmit() {
  formError.message = ''
  if (!validate()) return
  emit('submit', { ...form })
}

function setServerError(message, errors = null) {
  formError.message = message || t('common.somethingWentWrong')
  if (errors && typeof errors === 'object') {
    Object.entries(errors).forEach(([key, value]) => {
      fieldErrors[key] = Array.isArray(value) ? value[0] : String(value)
    })
  }
}

defineExpose({ setServerError })
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex">
    <div class="fixed inset-0 bg-black/40" @click="emit('close')" />

    <aside
      class="ms-auto relative w-full max-w-lg bg-white dark:bg-slate-800 h-full shadow-2xl overflow-y-auto border-s border-slate-200 dark:border-slate-700"
    >
      <div class="sticky top-0 z-10 bg-khubrat-blue text-white px-6 py-5 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-khubrat-goldLight">{{ title }}</h3>
          <p class="text-xs text-white/70 mt-0.5">{{ $t('staff.requiredHint') }}</p>
        </div>
        <button class="text-white/70 hover:text-white" @click="emit('close')">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <form class="p-6 space-y-4" @submit.prevent="handleSubmit">
        <BaseAlert v-if="formError.message" variant="error">{{ formError.message }}</BaseAlert>

        <BaseAlert v-if="mode === 'create'" variant="info">
          {{ $t('staff.optionalFieldsHint') }}
        </BaseAlert>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput v-model="form.full_name" :label="$t('staff.fullName')" required :error="fieldErrors.full_name" />
          <BaseInput v-model="form.email" :label="$t('staff.email')" type="email" required :error="fieldErrors.email" />
          <BaseInput v-model="form.phone" :label="$t('staff.phone')" placeholder="09xxxxxxxx" :error="fieldErrors.phone" />
          <BaseSelect
            v-model="form.department_id"
            :label="$t('staff.department')"
            required
            :options="departmentOptions"
            :error="fieldErrors.department_id"
            @mousedown="refreshDepartments"
            @keydown.enter="refreshDepartments"
          />
          <BaseInput v-model="form.job_title" :label="$t('staff.jobTitle')" required :error="fieldErrors.job_title" />
          <BaseInput
            v-model="form.base_salary"
            :label="$t('staff.baseSalary')"
            type="number"
            required
            :error="fieldErrors.base_salary"
          />
          <BaseInput
            v-model="form.hire_date"
            :label="$t('staff.hireDate')"
            type="date"
            required
            :error="fieldErrors.hire_date"
          />
          <BaseInput
            v-model="form.birth_date"
            :label="$t('staff.birthDate')"
            type="date"
            :error="fieldErrors.birth_date"
          />
          <BaseSelect
            v-model="form.employment_type"
            :label="$t('staff.employmentType')"
            :options="employmentOptions"
          />
          <BaseInput v-model="form.education" :label="$t('staff.education')" />
          <BaseSelect v-model="form.gender" :label="$t('staff.gender')" :options="genderOptions" :placeholder="$t('common.optional')" />
          <BaseSelect
            v-model="form.marital_status"
            :label="$t('staff.maritalStatus')"
            :options="maritalOptions"
            :placeholder="$t('common.optional')"
          />
          <BaseInput v-model="form.nationality" :label="$t('staff.nationality')" />
          <BaseInput v-model="form.residence" :label="$t('staff.residence')" />
        </div>

        <div class="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
          <div>
            <p class="text-sm font-bold text-khubrat-blue dark:text-white">{{ $t('staff.activeAccount') }}</p>
            <p class="text-xs text-slate-500">{{ $t('staff.inactiveHint') }}</p>
          </div>
          <ToggleSwitch v-model="form.is_active" />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</BaseButton>
          <BaseButton type="submit" variant="gold" :loading="saving">
            {{ mode === 'edit' ? $t('common.saveChanges') : $t('common.create') }}
          </BaseButton>
        </div>
      </form>
    </aside>
  </div>
</template>

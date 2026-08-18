<script setup>
import { computed, reactive, watch } from 'vue'
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

const emit = defineEmits(['close', 'submit'])

const departmentsStore = useDepartmentsStore()

const form = reactive(emptyForm())
const fieldErrors = reactive({})
const formError = reactive({ message: '' })

const title = computed(() => {
  const kind = props.staffType === STAFF_TYPE.HR ? 'HR Staff' : 'Employee'
  return props.mode === 'edit' ? `Edit ${kind}` : `Add ${kind}`
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

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' }
]

const maritalOptions = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' }
]

const employmentOptions = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' }
]

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

  if (!isRequired(form.full_name)) fieldErrors.full_name = 'Full name is required.'
  if (!isValidEmail(form.email)) fieldErrors.email = 'Enter a valid email address.'
  if (!isRequired(form.department_id)) fieldErrors.department_id = 'Department is required.'
  if (!isRequired(form.job_title)) fieldErrors.job_title = 'Job title is required.'
  if (!isRequired(form.base_salary) || Number(form.base_salary) < 0) {
    fieldErrors.base_salary = 'Base salary is required.'
  }
  if (!isValidHireDate(form.hire_date)) {
    fieldErrors.hire_date = 'Hire date is required and cannot be in the future.'
  }
  if (!isValidBirthDate(form.birth_date)) {
    fieldErrors.birth_date = 'Birth date must be a valid date and cannot be in the future.'
  }
  if (form.phone && !isValidPhone(form.phone)) {
    fieldErrors.phone = 'Phone must start with 09 and contain 10 digits.'
  }

  return Object.keys(fieldErrors).length === 0
}

function handleSubmit() {
  formError.message = ''
  if (!validate()) return
  emit('submit', { ...form })
}

function setServerError(message, errors = null) {
  formError.message = message || 'Something went wrong.'
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
      class="ml-auto relative w-full max-w-lg bg-white dark:bg-slate-800 h-full shadow-2xl overflow-y-auto border-l border-slate-200 dark:border-slate-700"
    >
      <div class="sticky top-0 z-10 bg-khubrat-blue text-white px-6 py-5 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-khubrat-goldLight">{{ title }}</h3>
          <p class="text-xs text-white/70 mt-0.5">Required fields are marked with an asterisk.</p>
        </div>
        <button class="text-white/70 hover:text-white" @click="emit('close')">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <form class="p-6 space-y-4" @submit.prevent="handleSubmit">
        <BaseAlert v-if="formError.message" variant="error">{{ formError.message }}</BaseAlert>

        <BaseAlert v-if="mode === 'create'" variant="info">
          Optional fields can be left blank and updated later from the profile sidebar.
        </BaseAlert>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput v-model="form.full_name" label="Full Name" required :error="fieldErrors.full_name" />
          <BaseInput v-model="form.email" label="Email" type="email" required :error="fieldErrors.email" />
          <BaseInput v-model="form.phone" label="Phone" placeholder="09xxxxxxxx" :error="fieldErrors.phone" />
          <BaseSelect
            v-model="form.department_id"
            label="Department"
            required
            :options="departmentOptions"
            :error="fieldErrors.department_id"
            @mousedown="refreshDepartments"
            @keydown.enter="refreshDepartments"
          />
          <BaseInput v-model="form.job_title" label="Job Title" required :error="fieldErrors.job_title" />
          <BaseInput
            v-model="form.base_salary"
            label="Base Salary"
            type="number"
            required
            :error="fieldErrors.base_salary"
          />
          <BaseInput
            v-model="form.hire_date"
            label="Hire Date"
            type="date"
            required
            :error="fieldErrors.hire_date"
          />
          <BaseInput
            v-model="form.birth_date"
            label="Birth Date"
            type="date"
            :error="fieldErrors.birth_date"
          />
          <BaseSelect
            v-model="form.employment_type"
            label="Employment Type"
            :options="employmentOptions"
          />
          <BaseInput v-model="form.education" label="Education" />
          <BaseSelect v-model="form.gender" label="Gender" :options="genderOptions" placeholder="Optional" />
          <BaseSelect
            v-model="form.marital_status"
            label="Marital Status"
            :options="maritalOptions"
            placeholder="Optional"
          />
          <BaseInput v-model="form.nationality" label="Nationality" />
          <BaseInput v-model="form.residence" label="Residence" />
        </div>

        <div class="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
          <div>
            <p class="text-sm font-bold text-khubrat-blue dark:text-white">Active Account</p>
            <p class="text-xs text-slate-500">Inactive accounts cannot sign in.</p>
          </div>
          <ToggleSwitch v-model="form.is_active" />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="ghost" @click="emit('close')">Cancel</BaseButton>
          <BaseButton type="submit" variant="gold" :loading="saving">
            {{ mode === 'edit' ? 'Save Changes' : 'Create' }}
          </BaseButton>
        </div>
      </form>
    </aside>
  </div>
</template>

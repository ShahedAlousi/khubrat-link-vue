<script setup>
import { computed, reactive, watch } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import ToggleSwitch from '@/components/policies/ToggleSwitch.vue'
import { isRequired } from '@/utils/validators'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // create | edit
  initial: { type: Object, default: null },
  employeeOptions: { type: Array, default: () => [] },
  employeesLoading: { type: Boolean, default: false },
  saving: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit'])

const NONE_MANAGER = '__none__'

const form = reactive({
  name: '',
  is_active: true,
  manager_id: NONE_MANAGER
})

const fieldErrors = reactive({})
const formError = reactive({ message: '' })

const title = computed(() => (props.mode === 'edit' ? 'Edit Department' : 'Add Department'))

const managerSelectOptions = computed(() => [
  { value: NONE_MANAGER, label: 'No manager assigned' },
  ...props.employeeOptions
])

function resetForm() {
  form.name = ''
  form.is_active = true
  form.manager_id = NONE_MANAGER
  formError.message = ''
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
}

function fillFromInitial(row) {
  form.name = row?.name ?? ''
  form.is_active = row?.is_active ?? true
  form.manager_id = row?.manager_id || NONE_MANAGER
}

watch(
  () => [props.open, props.initial, props.mode],
  () => {
    formError.message = ''
    Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
    if (props.mode === 'edit' && props.initial) fillFromInitial(props.initial)
    else resetForm()
  },
  { immediate: true }
)

function validate() {
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  if (!isRequired(form.name)) fieldErrors.name = 'Department name is required.'
  return Object.keys(fieldErrors).length === 0
}

function handleSubmit() {
  formError.message = ''
  if (!validate()) return
  emit('submit', {
    name: form.name,
    is_active: form.is_active,
    manager_id: form.manager_id === NONE_MANAGER ? null : form.manager_id
  })
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
      class="ml-auto relative w-full max-w-md bg-white dark:bg-slate-800 h-full shadow-2xl overflow-y-auto border-l border-slate-200 dark:border-slate-700"
    >
      <div class="sticky top-0 z-10 bg-khubrat-blue text-white px-6 py-5 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-khubrat-goldLight">{{ title }}</h3>
          <p class="text-xs text-white/70 mt-0.5">Configure department details and status.</p>
        </div>
        <button class="text-white/70 hover:text-white" @click="emit('close')">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <form class="p-6 space-y-5" @submit.prevent="handleSubmit">
        <BaseAlert v-if="formError.message" variant="error">{{ formError.message }}</BaseAlert>

        <BaseAlert v-if="mode === 'create'" variant="info">
          Create the department first without a manager. After you add employees to this department,
          return here to assign a department manager from that list.
        </BaseAlert>

        <BaseInput
          v-model="form.name"
          label="Department Name"
          placeholder="e.g. Information Technology"
          required
          :error="fieldErrors.name"
        />

        <div
          class="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3"
        >
          <div>
            <p class="text-sm font-bold text-khubrat-blue dark:text-white">Active Status</p>
            <p class="text-xs text-slate-500">Inactive departments stay hidden from new assignments.</p>
          </div>
          <ToggleSwitch v-model="form.is_active" />
        </div>

        <div v-if="mode === 'edit'" class="space-y-2">
          <BaseSelect
            v-model="form.manager_id"
            label="Department Manager"
            :options="managerSelectOptions"
            :placeholder="employeesLoading ? 'Loading employees…' : 'Select a manager (optional)'"
            :error="fieldErrors.manager_id"
          />
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Only active employees who already belong to this department can be selected.
            Changing the manager demotes the previous manager automatically.
          </p>
          <p v-if="!employeesLoading && !employeeOptions.length" class="text-[11px] text-amber-600 dark:text-amber-400">
            No employees in this department yet. Add employees first, then assign a manager.
          </p>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="ghost" @click="emit('close')">Cancel</BaseButton>
          <BaseButton type="submit" variant="gold" :loading="saving">
            {{ mode === 'edit' ? 'Save Changes' : 'Create Department' }}
          </BaseButton>
        </div>
      </form>
    </aside>
  </div>
</template>

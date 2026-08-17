<script setup>
import { reactive } from 'vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import { isRequired } from '@/utils/validators'

const props = defineProps({
  plan: { type: Object, default: null }, // null => create mode
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['save', 'cancel'])

const isEdit = Boolean(props.plan)

const form = reactive({
  name: props.plan?.name ?? '',
  price: props.plan?.price ?? '',
  max_employees: props.plan?.max_employees ?? '',
  plan_type: props.plan?.plan_type ?? 'paid',
  billing_period: props.plan?.billing_period ?? 'month',
  max_uses_per_company: props.plan?.max_uses_per_company ?? 1,
  description: props.plan?.description ?? '',
  is_active: props.plan?.is_active ?? true
})

const fieldErrors = reactive({ name: '', price: '', max_employees: '', max_uses_per_company: '' })

const planTypeOptions = [
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' }
]

const billingPeriodOptions = [
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' }
]

function validate() {
  fieldErrors.name = isRequired(form.name) ? '' : 'Package name is required.'
  fieldErrors.price = form.price !== '' && Number(form.price) >= 0 ? '' : 'Enter a valid price.'
  fieldErrors.max_employees = Number(form.max_employees) > 0 ? '' : 'Enter the allowed seat count.'
  fieldErrors.max_uses_per_company = Number(form.max_uses_per_company) > 0 ? '' : 'Must be at least 1.'
  return !fieldErrors.name && !fieldErrors.price && !fieldErrors.max_employees && !fieldErrors.max_uses_per_company
}

function handleSave() {
  if (!validate()) return
  emit('save', {
    name: form.name,
    price: Number(form.price),
    max_employees: Number(form.max_employees),
    plan_type: form.plan_type,
    billing_period: form.billing_period,
    max_uses_per_company: Number(form.max_uses_per_company),
    description: form.description,
    is_active: form.is_active
  })
}
</script>

<template>
  <ConfirmModal
    :title="isEdit ? 'Edit Package Plan Details' : 'Launch New HR Package Plan'"
    confirm-label="Save Changes"
    confirm-variant="blue"
    :loading="loading"
    @confirm="handleSave"
    @cancel="emit('cancel')"
  >
    <BaseInput v-model="form.name" label="Package Name" required :error="fieldErrors.name" />

    <div class="grid grid-cols-2 gap-4">
      <BaseInput v-model="form.price" type="number" label="Price ($ USD)" required :error="fieldErrors.price" />
      <BaseInput v-model="form.max_employees" type="number" label="Allowed Staff/Seats" required :error="fieldErrors.max_employees" />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <BaseSelect v-model="form.plan_type" label="Plan Type" :options="planTypeOptions" required />
      <BaseSelect v-model="form.billing_period" label="Billing Period" :options="billingPeriodOptions" required />
    </div>

    <BaseInput
      v-model="form.max_uses_per_company"
      type="number"
      label="Max Uses Per Company"
      required
      :error="fieldErrors.max_uses_per_company"
    />

    <div class="space-y-1">
      <label class="text-xs font-bold text-slate-400">Short Package Pitch/Description</label>
      <textarea
        v-model="form.description"
        rows="3"
        class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white"
      ></textarea>
    </div>

    <label class="flex items-center gap-2 pt-1">
      <input v-model="form.is_active" type="checkbox" class="w-4 h-4 rounded text-khubrat-blue focus:ring-0" />
      <span class="text-xs font-semibold text-slate-500 dark:text-slate-300">Set Package as immediately Active &amp; Available</span>
    </label>
  </ConfirmModal>
</template>
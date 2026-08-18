<script setup>
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import { isRequired } from '@/utils/validators'

const props = defineProps({
  holiday: { type: Object, default: null }, // null => create mode
  initialStartDate: { type: String, default: '' }, // pre-fill من نقرة أو سحب على التقويم
  initialEndDate: { type: String, default: '' }, // نهاية النطاق المسحوب (تساوي البداية ليوم واحد)
  loading: { type: Boolean, default: false }
})

const { t } = useI18n()
const emit = defineEmits(['save', 'cancel'])

const isEdit = Boolean(props.holiday)

// لو النطاق الممرَّر يغطي أكثر من يوم واحد، يُفتح النموذج مباشرة كـ "نطاق تاريخ"
const initialIsRange = Boolean(props.initialStartDate) && props.initialStartDate !== props.initialEndDate

const form = reactive({
  name: props.holiday?.name ?? '',
  holiday_type: props.holiday?.holiday_type ?? (initialIsRange ? 'date_range' : 'single_day'),
  start_date: props.holiday?.start_date ?? props.initialStartDate,
  end_date: props.holiday?.end_date ?? props.initialEndDate ?? props.initialStartDate,
  repeats_annually: props.holiday?.repeats_annually ?? false
})

const fieldErrors = reactive({ name: '', start_date: '', end_date: '' })

const holidayTypeOptions = computed(() => [
  { value: 'single_day', label: t('policies.singleDay') },
  { value: 'date_range', label: t('policies.dateRange') }
])

const isRange = computed(() => form.holiday_type === 'date_range')

function validate() {
  fieldErrors.name = isRequired(form.name) ? '' : t('validation.holidayNameRequired')
  fieldErrors.start_date = isRequired(form.start_date) ? '' : t('validation.startDateRequired')
  fieldErrors.end_date = isRange.value && !isRequired(form.end_date) ? t('validation.endDateRequired') : ''
  return !fieldErrors.name && !fieldErrors.start_date && !fieldErrors.end_date
}

function handleSave() {
  if (!validate()) return
  emit('save', {
    name: form.name,
    holiday_type: form.holiday_type,
    start_date: form.start_date,
    end_date: isRange.value ? form.end_date : form.start_date,
    repeats_annually: form.repeats_annually
  })
}
</script>

<template>
  <ConfirmModal
    :title="isEdit ? $t('policies.editHoliday') : $t('policies.addHoliday')"
    :confirm-label="$t('policies.saveHoliday')"
    confirm-variant="blue"
    :loading="loading"
    @confirm="handleSave"
    @cancel="emit('cancel')"
  >
    <BaseInput v-model="form.name" :label="$t('policies.holidayName')" required :error="fieldErrors.name" />

    <BaseSelect v-model="form.holiday_type" :label="$t('policies.dateSelection')" :options="holidayTypeOptions" required />

    <div class="grid grid-cols-2 gap-4">
      <BaseInput
        v-model="form.start_date"
        type="date"
        :label="isRange ? $t('policies.commencement') : $t('policies.holidayDate')"
        required
        :error="fieldErrors.start_date"
      />
      <BaseInput v-if="isRange" v-model="form.end_date" type="date" :label="$t('policies.termination')" required :error="fieldErrors.end_date" />
    </div>

    <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800">
      <div class="space-y-0.5">
        <label class="text-xs font-bold text-slate-500 dark:text-slate-300">{{ $t('policies.annualRecurrence') }}</label>
        <p class="text-[9px] text-slate-400">{{ $t('policies.repeatsHint') }}</p>
      </div>
      <ToggleSwitch v-model="form.repeats_annually" />
    </div>
  </ConfirmModal>
</template>
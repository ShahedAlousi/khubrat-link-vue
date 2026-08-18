<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  readonly: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const { t, tm } = useI18n()

const DAY_VALUES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const weekdayOptions = computed(() => {
  const labels = tm('weekdays.long')
  const resolved = Array.isArray(labels)
    ? labels
    : DAY_VALUES.map((_, i) => t(`weekdays.long[${i}]`))
  return DAY_VALUES.map((value, index) => ({
    value,
    label: resolved[index] ?? value
  }))
})

const displayLabel = computed(() => props.label || t('policies.daysLabel'))

const open = ref(false)
const rootEl = ref(null)

function isChecked(day) {
  return props.modelValue.includes(day)
}

function toggleDay(day) {
  const next = isChecked(day) ? props.modelValue.filter((d) => d !== day) : [...props.modelValue, day]
  emit('update:modelValue', next)
}

function selectedLabel() {
  if (!props.modelValue.length) return t('policies.noDaysSelected')
  return weekdayOptions.value
    .filter((w) => props.modelValue.includes(w.value))
    .map((w) => w.label)
    .join(', ')
}

function handleOutsideClick(event) {
  if (rootEl.value && !rootEl.value.contains(event.target)) open.value = false
}

onMounted(() => window.addEventListener('click', handleOutsideClick))
onBeforeUnmount(() => window.removeEventListener('click', handleOutsideClick))
</script>

<template>
  <div ref="rootEl" class="relative">
    <span class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
      {{ displayLabel }}
    </span>
    <p v-if="readonly" class="text-sm font-semibold text-slate-800 dark:text-slate-100">
      {{ selectedLabel() }}
    </p>
    <button
      v-else
      type="button"
      class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-start flex justify-between items-center dark:text-white transition-all"
      @click="open = !open"
    >
      <span>{{ selectedLabel() }}</span>
      <i class="fa-solid fa-chevron-down text-slate-400"></i>
    </button>

    <div
      v-if="open"
      class="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-3 space-y-1"
    >
      <label
        v-for="day in weekdayOptions"
        :key="day.value"
        class="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer select-none"
      >
        <input
          type="checkbox"
          :checked="isChecked(day.value)"
          class="text-khubrat-blue focus:ring-0 rounded"
          @change="toggleDay(day.value)"
        />
        <span>{{ day.label }}</span>
      </label>
    </div>
  </div>
</template>

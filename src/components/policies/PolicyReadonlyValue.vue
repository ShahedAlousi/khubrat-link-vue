<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  label: { type: String, default: '' },
  value: { type: [String, Number], default: '' },
  hint: { type: String, default: '' }
})

const { t } = useI18n()
const displayValue = computed(() =>
  props.value === null || props.value === undefined || props.value === ''
    ? t('common.emDash')
    : props.value
)
</script>

<template>
  <div class="space-y-1">
    <p v-if="label" class="text-xs font-bold text-slate-500 dark:text-slate-300">{{ label }}</p>
    <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ displayValue }}</p>
    <p v-if="hint" class="text-[11px] text-slate-400 leading-normal">{{ hint }}</p>
  </div>
</template>

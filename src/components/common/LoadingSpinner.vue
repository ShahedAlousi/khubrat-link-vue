<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  label: { type: String, default: '' },
  fullHeight: { type: Boolean, default: false }
})

const { t } = useI18n()
const resolvedLabel = computed(() => props.label || t('common.loading'))
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 text-slate-400"
    :class="fullHeight ? 'h-full min-h-[240px]' : 'py-10'"
  >
    <i class="fa-solid fa-circle-notch fa-spin text-2xl text-khubrat-blue dark:text-khubrat-goldLight"></i>
    <span class="text-xs font-bold uppercase tracking-wider">{{ resolvedLabel }}</span>
  </div>
</template>

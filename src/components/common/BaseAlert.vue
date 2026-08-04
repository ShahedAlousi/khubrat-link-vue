<script setup>
defineProps({
  variant: {
    type: String,
    default: 'error', // 'error' | 'success' | 'info'
    validator: (v) => ['error', 'success', 'info'].includes(v)
  }
})

const styles = {
  error: {
    wrap: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-900',
    icon: 'fa-circle-exclamation'
  },
  success: {
    wrap: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300',
    icon: 'fa-circle-check'
  },
  info: {
    wrap: 'bg-khubrat-blue/5 dark:bg-slate-800 border-khubrat-blue/20 dark:border-slate-700 text-khubrat-blue dark:text-khubrat-goldLight',
    icon: 'fa-circle-info'
  }
}
</script>

<template>
  <div class="flex items-start gap-2.5 border rounded-xl px-4 py-3 text-sm font-semibold" :class="styles[variant].wrap">
    <i class="fa-solid mt-0.5" :class="styles[variant].icon"></i>
    <div class="flex-1"><slot /></div>
  </div>
</template>

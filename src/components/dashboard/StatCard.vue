<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  hintClass: { type: String, default: 'text-emerald-500' },
  icon: { type: String, required: true },
  iconWrapClass: { type: String, default: 'bg-khubrat-blue/10 dark:bg-khubrat-blue/30 text-khubrat-blue dark:text-khubrat-goldLight' }
})
</script>

<template>
  <div
    class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between"
  >
    <div class="space-y-1">
      <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ label }}</p>
      <h3 class="text-2xl font-black text-khubrat-blue dark:text-white">{{ value }}</h3>
      <p v-if="hint" class="text-[11px] font-bold" :class="hintClass">{{ hint }}</p>
    </div>
    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl" :class="iconWrapClass">
      <i class="fa-solid" :class="icon"></i>
    </div>
  </div>
</template>

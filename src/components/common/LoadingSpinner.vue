<script setup>
defineProps({
  label: { type: String, default: 'Loading…' },
  fullHeight: { type: Boolean, default: false }
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 text-slate-400"
    :class="fullHeight ? 'h-full min-h-[240px]' : 'py-10'"
  >
    <i class="fa-solid fa-circle-notch fa-spin text-2xl text-khubrat-blue dark:text-khubrat-goldLight"></i>
    <span class="text-xs font-bold uppercase tracking-wider">{{ label }}</span>
  </div>
</template>

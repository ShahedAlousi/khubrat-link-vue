<!-- // BaseButton.vue -->
<script setup>
defineProps({
  type: { type: String, default: 'button' },
  variant: {
    type: String,
    default: 'gold', // 'gold' | 'blue' | 'ghost' | 'danger'
    validator: (v) => ['gold', 'blue', 'ghost', 'danger'].includes(v)
  },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  fullWidth: { type: Boolean, default: false }
})

defineEmits(['click'])

const variantClasses = {
  // تم تعديل الزر الذهبي ليصبح بمظهر متدرج ناعم وأنيق مع ظل ناعم مطابق للصورة تماماً
  gold: 'bg-gradient-to-r from-[#bd8a39] to-[#e3b76a] text-slate-900 shadow-md hover:brightness-105 active:brightness-95',
  blue: 'bg-khubrat-blue hover:bg-opacity-90 text-white shadow-md',
  ghost: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200',
  danger: 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-xl font-bold text-sm px-5 py-3 transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
    :class="[variantClasses[variant], fullWidth ? 'w-full' : '']"
    @click="$emit('click', $event)"
  >
    <i v-if="loading" class="fa-solid fa-circle-notch fa-spin"></i>
    <slot />
  </button>
</template>

<style scoped>
</style>
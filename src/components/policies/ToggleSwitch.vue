<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <label class="relative inline-flex items-center" :class="disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="sr-only peer"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <div
      class="w-9 h-5 bg-red-200 dark:bg-red-950/40 border border-red-300 dark:border-red-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-600"
    ></div>
  </label>
</template>

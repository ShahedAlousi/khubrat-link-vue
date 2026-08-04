<script setup>
import { useId } from 'vue'

defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  options: {
    type: Array,
    default: () => []
    // Array of { value, label }
  },
  placeholder: { type: String, default: 'Select…' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])

const selectId = useId()
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="selectId" class="text-xs font-bold text-slate-500 dark:text-slate-300">
      {{ label }}<span v-if="required" class="text-rose-500"> *</span>
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      class="w-full bg-white/70 dark:bg-slate-900/70 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-khubrat-goldLight transition-all"
      :class="error ? 'border-rose-400' : 'border-khubrat-blue/30 dark:border-slate-700'"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" class="text-xs font-semibold text-rose-500">{{ error }}</p>
  </div>
</template>
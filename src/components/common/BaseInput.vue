<!-- // BaseInput.vue -->
<script setup>
import { computed, ref, useId } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  autocomplete: { type: String, default: 'off' }
})

defineEmits(['update:modelValue'])

const inputId = useId()
const showPassword = ref(false)

const isPassword = computed(() => props.type === 'password')
const resolvedType = computed(() => {
  if (!isPassword.value) return props.type
  return showPassword.value ? 'text' : 'password'
})
</script>

<template>
  <div class="space-y-1.5 text-start">
    <!-- تعديل: لون العنوان الجانبي (Label) ليصبح باللون الأزرق الداكن المتناسق مع الهوية البصرية وشعار الشركة -->
    <label
      v-if="label"
      :for="inputId"
      class="text-xs font-bold text-[#061c3f] dark:text-white"
    >
      {{ label }}<span v-if="required" class="text-rose-900"> *</span>
    </label>

    <div class="relative">
      <input
        :id="inputId"
        :type="resolvedType"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        class="w-full rounded-xl border px-4 py-2.5 text-sm transition-all duration-150 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:hover:border-slate-200 dark:disabled:hover:border-slate-700 disabled:hover:ring-0"
        :class="[
          props.error
            ? 'bg-white dark:bg-slate-800 border-rose-500 dark:border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-800 dark:text-slate-200'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#bd8a39] dark:hover:border-khubrat-goldLight hover:ring-4 hover:ring-[#bd8a39]/20 dark:hover:ring-khubrat-goldLight/20 focus:border-[#bd8a39] dark:focus:border-khubrat-goldLight focus:ring-4 focus:ring-[#bd8a39]/30 dark:focus:ring-khubrat-goldLight/30'
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
      />

      <button
        v-if="isPassword"
        type="button"
        tabindex="-1"
        class="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100"
        @click="showPassword = !showPassword"
      >
        <i class="fa-solid" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
      </button>
    </div>

    <!-- تعديل: عند الخطأ تظهر الرسالة بلون أحمر تحذيري واضح لضمان معايير الـ UX -->
    <p v-if="error" class="text-xs font-semibold text-rose-900">{{ error }}</p>
  </div>
</template>

<style scoped>
</style>
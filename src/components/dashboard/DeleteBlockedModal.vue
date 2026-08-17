<script setup>
import BaseButton from '@/components/common/BaseButton.vue'

defineProps({
  companyName: { type: String, default: '' },
  details: { type: String, default: '' },
  canFreeze: { type: Boolean, default: true }
})

const emit = defineEmits(['freeze', 'cancel'])
</script>

<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
      <div class="bg-khubrat-blue text-white p-6 flex justify-between items-center">
        <h3 class="text-lg font-bold text-khubrat-goldLight">Deletion Not Allowed</h3>
        <button class="text-white/60 hover:text-white transition-all" @click="emit('cancel')">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div class="p-6 space-y-4">
        <div
          class="flex gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-4"
        >
          <i class="fa-solid fa-triangle-exclamation text-amber-500 text-lg mt-0.5"></i>
          <div class="space-y-1.5">
            <p class="text-sm font-bold text-amber-800 dark:text-amber-300">
              This company cannot be deleted because it has current activity.
            </p>
            <p class="text-xs leading-relaxed text-amber-700/90 dark:text-amber-400/90">
              <template v-if="companyName"><strong>{{ companyName }}</strong> still holds</template>
              <template v-else>This account still holds</template>
              related records such as employees, payroll or requests. Would you like to freeze it instead? Freezing
              blocks all portal access while keeping the data intact.
            </p>
            <p v-if="details" class="text-[11px] text-amber-700/70 dark:text-amber-400/70 italic">
              Server response: {{ details }}
            </p>
          </div>
        </div>

        <p v-if="!canFreeze" class="text-xs text-slate-500 dark:text-slate-400">
          This company account is already frozen.
        </p>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="ghost" @click="emit('cancel')">Cancel</BaseButton>
          <BaseButton v-if="canFreeze" variant="gold" @click="emit('freeze')">
            <i class="fa-solid fa-snowflake"></i>
            Freeze Instead
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

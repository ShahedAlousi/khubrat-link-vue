<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  title: { type: String, required: true },
  confirmLabel: { type: String, default: '' },
  confirmVariant: { type: String, default: 'blue' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['confirm', 'cancel'])
const { t } = useI18n()
const resolvedConfirm = computed(() => props.confirmLabel || t('common.confirm'))
</script>

<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
      <div class="bg-khubrat-blue text-white p-6 flex justify-between items-center">
        <h3 class="text-lg font-bold text-khubrat-goldLight">{{ title }}</h3>
        <button class="text-white/60 hover:text-white transition-all" @click="emit('cancel')">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <slot />
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="ghost" @click="emit('cancel')">{{ $t('common.cancel') }}</BaseButton>
          <BaseButton :variant="confirmVariant" :loading="loading" @click="emit('confirm')">
            {{ resolvedConfirm }}
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

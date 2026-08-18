<script setup>
import { ref } from 'vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

defineProps({
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['confirm', 'cancel'])
const reason = ref('')

function handleConfirm() {
  emit('confirm', reason.value.trim())
}
</script>

<template>
  <ConfirmModal
    :title="$t('dashboard.freezeTitle')"
    :confirm-label="$t('dashboard.freezeAccount')"
    confirm-variant="danger"
    :loading="loading"
    @confirm="handleConfirm"
    @cancel="emit('cancel')"
  >
    <p class="text-xs text-slate-500 dark:text-slate-400">
      {{ $t('dashboard.freezeReasonHint') }}
    </p>
    <textarea
      v-model="reason"
      rows="3"
      :placeholder="$t('dashboard.freezePlaceholder')"
      class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white"
    ></textarea>
  </ConfirmModal>
</template>

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
    title="Freeze Company Account"
    confirm-label="Freeze Account"
    confirm-variant="danger"
    :loading="loading"
    @confirm="handleConfirm"
    @cancel="emit('cancel')"
  >
    <p class="text-xs text-slate-500 dark:text-slate-400">
      State the administrative justification for freezing this company's portal account (optional).
    </p>
    <textarea
      v-model="reason"
      rows="3"
      placeholder="e.g. Payment gateway failed on renewal verification check."
      class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white"
    ></textarea>
  </ConfirmModal>
</template>

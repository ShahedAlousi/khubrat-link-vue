<script setup>
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/common/BaseButton.vue'
import { isRequired } from '@/utils/validators'

const props = defineProps({
  open: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit'])
const { t } = useI18n()

const form = reactive({ rejection_reason: '' })
const fieldErrors = reactive({ rejection_reason: '' })

const snippets = computed(() => [
  t('requests.snippetWorkload'),
  t('requests.snippetCoverage'),
  t('requests.snippetProof'),
  t('requests.snippetConflict')
])

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    form.rejection_reason = ''
    fieldErrors.rejection_reason = ''
  }
)

function applySnippet(text) {
  form.rejection_reason = text
  fieldErrors.rejection_reason = ''
}

function validate() {
  fieldErrors.rejection_reason = isRequired(form.rejection_reason)
    ? ''
    : t('validation.rejectionReasonRequired')
  return !fieldErrors.rejection_reason
}

function submit() {
  if (!validate()) return
  emit('submit', form.rejection_reason.trim())
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
    >
      <div
        class="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
      >
        <div class="bg-khubrat-blue text-white p-6 flex justify-between items-center gap-3">
          <div>
            <h3 class="text-md font-extrabold text-khubrat-goldLight">{{ $t('requests.rejectTitle') }}</h3>
            <p class="text-[10px] text-white/60">{{ $t('requests.rejectHint') }}</p>
          </div>
          <button class="text-white/60 hover:text-white" @click="emit('close')">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-400">{{ $t('requests.snippets') }}</label>
            <div class="flex flex-wrap gap-2 pt-1">
              <button
                v-for="snippet in snippets"
                :key="snippet"
                type="button"
                class="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-khubrat-goldDark dark:hover:border-khubrat-goldLight rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-all"
                @click="applySnippet(snippet)"
              >
                {{ snippet }}
              </button>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-400">{{ $t('requests.customNotes') }}</label>
            <textarea
              v-model="form.rejection_reason"
              rows="3"
              :placeholder="$t('requests.customPlaceholder')"
              class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white transition-all"
              :class="fieldErrors.rejection_reason ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'"
            />
            <p v-if="fieldErrors.rejection_reason" class="text-xs font-semibold text-rose-500">
              {{ fieldErrors.rejection_reason }}
            </p>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <BaseButton variant="ghost" @click="emit('close')">{{ $t('common.cancel') }}</BaseButton>
            <BaseButton
              class="!bg-rose-600 hover:!bg-rose-700 !text-white"
              :loading="loading"
              @click="submit"
            >
              {{ $t('requests.submitRejection') }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

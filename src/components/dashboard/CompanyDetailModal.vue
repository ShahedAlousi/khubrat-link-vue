<script setup>
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { formatDate } from '@/utils/format'
import { translateStatus } from '@/i18n/helpers'

const props = defineProps({
  loading: { type: Boolean, default: false },
  detail: { type: Object, default: null }
})

const emit = defineEmits(['close', 'freeze', 'activate'])

function status(detail) {
  if (!detail) return 'active'
  return detail.status || 'active'
}
</script>

<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
      <div class="bg-khubrat-blue text-white p-6 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 class="text-lg font-bold text-khubrat-goldLight">{{ $t('dashboard.companyDetails') }}</h3>
          <p v-if="detail" class="text-xs text-white/70 mt-0.5">{{ detail.name }} ({{ detail.email }})</p>
        </div>
        <button class="text-white/60 hover:text-white transition-all" @click="emit('close')">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div class="p-6 overflow-y-auto flex-1">
        <LoadingSpinner v-if="loading" :label="$t('dashboard.loadingCompanyDetails')" />

        <div v-else-if="detail" class="space-y-6">
          <!-- تعديل وتوزيع الحقول بحسب ريسبونس التفاصيل تماماً (8 حقول متناسقة) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            
            <div class="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-1">
              <p class="text-[11px] font-bold text-slate-400 uppercase">{{ $t('dashboard.contactPerson') }}</p>
              <p class="font-bold text-slate-800 dark:text-white">
                {{ detail.manager_full_name || $t('common.emDash') }}
              </p>
            </div>
            
            <div class="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-1">
              <p class="text-[11px] font-bold text-slate-400 uppercase">{{ $t('dashboard.domain') }}</p>
              <p class="font-bold text-slate-800 dark:text-white">{{ detail.domain || $t('common.emDash') }}</p>
            </div>

            <div class="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-1">
              <p class="text-[11px] font-bold text-slate-400 uppercase">{{ $t('dashboard.phone') }}</p>
              <p class="font-bold text-slate-800 dark:text-white">{{ detail.phone || $t('common.emDash') }}</p>
            </div>
            
            <div class="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-1">
              <p class="text-[11px] font-bold text-slate-400 uppercase">{{ $t('dashboard.address') }}</p>
              <p class="font-bold text-slate-800 dark:text-white">{{ detail.address || $t('common.emDash') }}</p>
            </div>
            
            <div class="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-1">
              <p class="text-[11px] font-bold text-slate-400 uppercase">{{ $t('dashboard.startDate') }}</p>
              <p class="font-bold text-slate-800 dark:text-white">
                {{ detail.start_date ? formatDate(detail.start_date) : $t('common.emDash') }}
              </p>
            </div>

            <div class="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-1">
              <p class="text-[11px] font-bold text-slate-400 uppercase">{{ $t('dashboard.endDate') }}</p>
              <p class="font-bold text-slate-800 dark:text-white">
                {{ detail.end_date ? formatDate(detail.end_date) : $t('common.emDash') }}
              </p>
            </div>

            <div class="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-1">
              <p class="text-[11px] font-bold text-slate-400 uppercase">{{ $t('dashboard.planPrice') }}</p>
              <p class="font-bold text-slate-800 dark:text-white">
                {{ detail.plan_price !== null ? detail.plan_price : $t('common.emDash') }}
              </p>
            </div>
            
            <div class="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-1">
              <p class="text-[11px] font-bold text-slate-400 uppercase">{{ $t('dashboard.status') }}</p>
              <p class="font-bold capitalize" :class="status(detail) === 'active' ? 'text-emerald-500' : 'text-amber-500'">
                {{ translateStatus(status(detail)) }}
              </p>
            </div>
            
          </div>

          <div class="border-t border-slate-100 dark:border-slate-700 pt-4 flex justify-between items-center">
            <div class="space-y-0.5">
              <p class="text-xs font-bold">{{ $t('dashboard.statusAction') }}</p>
              <p class="text-[11px] text-slate-400">{{ $t('dashboard.freezeHint') }}</p>
            </div>
            <BaseButton
              v-if="status(detail) === 'active'"
              variant="ghost"
              class="!bg-amber-500 hover:!bg-amber-600 !text-white"
              @click="emit('freeze', detail)"
            >
              <i class="fa-solid fa-user-slash"></i> {{ $t('dashboard.freeze') }}
            </BaseButton>
            <BaseButton v-else variant="ghost" class="!bg-emerald-500 hover:!bg-emerald-600 !text-white" @click="emit('activate', detail)">
              <i class="fa-solid fa-circle-check"></i> {{ $t('dashboard.reactivate') }}
            </BaseButton>
          </div>
        </div>

        <p v-else class="text-center text-sm text-slate-400 py-10">{{ $t('dashboard.noDetails') }}</p>
      </div>
    </div>
  </div>
</template>

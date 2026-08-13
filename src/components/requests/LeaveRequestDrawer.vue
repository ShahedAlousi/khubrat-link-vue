<script setup>
import { computed } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { formatDate, initials } from '@/utils/format'

const props = defineProps({
  open: { type: Boolean, default: false },
  request: { type: Object, default: null },
  canAct: { type: Boolean, default: false },
  actionLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'approve', 'reject'])

const employeeInitials = computed(() => initials(props.request?.employee_name))

function display(value) {
  return value === null || value === undefined || value === '' ? '—' : value
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-black/55 backdrop-blur-[1px]" @click="emit('close')" />

      <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          class="pointer-events-auto w-screen max-w-md bg-white dark:bg-slate-800 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700"
        >
          <div class="bg-khubrat-blue text-white p-6 border-b border-khubrat-goldLight/20">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-sm font-extrabold text-khubrat-goldLight uppercase tracking-wider">
                Request Details File
              </h2>
              <button class="text-white/60 hover:text-white transition-all" @click="emit('close')">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
          </div>

          <div v-if="request" class="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
            <div class="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div
                class="w-14 h-14 rounded-2xl bg-khubrat-blue/10 dark:bg-khubrat-goldLight/10 text-khubrat-blue dark:text-khubrat-goldLight flex items-center justify-center font-black text-lg shrink-0"
              >
                {{ employeeInitials }}
              </div>
              <div class="min-w-0">
                <h3 class="text-base font-extrabold text-slate-800 dark:text-slate-100 truncate">
                  {{ request.employee_name }}
                </h3>
                <p class="text-xs text-slate-400">{{ display(request.department_name) }}</p>
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Request Parameters</p>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p class="text-[10px] font-bold text-slate-400">Leave Category</p>
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {{ display(request.leave_type_name) }}
                  </p>
                </div>
                <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p class="text-[10px] font-bold text-slate-400">Duration</p>
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {{ request.duration_days }} day(s)
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p class="text-[10px] font-bold text-slate-400">Start Date</p>
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {{ formatDate(request.start_date) }}
                  </p>
                </div>
                <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p class="text-[10px] font-bold text-slate-400">End Date</p>
                  <p class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {{ formatDate(request.end_date) }}
                  </p>
                </div>
              </div>

              <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <p class="text-[10px] font-bold text-slate-400">Remaining Balance</p>
                <p class="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {{ request.remaining_balance_days }} day(s)
                </p>
              </div>

              <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <p class="text-[10px] font-bold text-slate-400">Reason Note</p>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{{ display(request.reason) }}</p>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                <span
                  class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 capitalize"
                >
                  {{ display(request.status) }}
                </span>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
            <template v-if="canAct && request">
              <BaseButton
                class="flex-1 !bg-emerald-600 hover:!bg-emerald-700 !text-white"
                :loading="actionLoading"
                @click="emit('approve', request.id)"
              >
                <i class="fa-solid fa-check"></i>
                Approve Request
              </BaseButton>
              <BaseButton
                class="flex-1 !bg-rose-600 hover:!bg-rose-700 !text-white"
                :loading="actionLoading"
                @click="emit('reject', request.id)"
              >
                <i class="fa-solid fa-xmark"></i>
                Reject Request
              </BaseButton>
            </template>
            <BaseButton v-else class="w-full" variant="ghost" @click="emit('close')">
              Close Details File
            </BaseButton>
          </div>
        </aside>
      </div>
    </div>
  </Teleport>
</template>

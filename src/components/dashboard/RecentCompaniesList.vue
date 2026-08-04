<script setup>
import { formatDate } from '@/utils/format'

defineProps({
  // Array of { id, name, created_at, status, package } from /api/companies/stats
  platforms: { type: Array, default: () => [] }
})

const statusBadge = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400',
  frozen: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
  at_risk: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
    <h4 class="text-md font-bold text-khubrat-blue dark:text-white mb-4">Latest Registered Platforms</h4>

    <div v-if="!platforms.length" class="text-center text-xs font-semibold text-slate-400 py-8">
      <i class="fa-solid fa-folder-open text-2xl mb-2 block"></i>
      No companies registered yet.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="text-slate-400 border-b border-slate-100 dark:border-slate-700">
            <th class="pb-3">Company</th>
            <th class="pb-3">Registered on</th>
            <th class="pb-3">Package</th>
            <th class="pb-3">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50 dark:divide-slate-700/60">
          <tr v-for="platform in platforms" :key="platform.id">
            <td class="py-3 font-extrabold text-slate-800 dark:text-white">{{ platform.name }}</td>
            <td class="py-3 text-slate-500 dark:text-slate-400 font-semibold">{{ formatDate(platform.created_at) }}</td>
            <td class="py-3">
              <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                {{ platform.package || '—' }}
              </span>
            </td>
            <td class="py-3">
              <span
                class="px-2.5 py-1 text-[10px] font-black rounded-lg"
                :class="statusBadge[platform.status] || statusBadge.active"
              >
                {{ platform.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

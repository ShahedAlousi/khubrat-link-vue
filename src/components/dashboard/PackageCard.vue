<script setup>
defineProps({
  plan: { type: Object, required: true }
})

defineEmits(['edit', 'delete', 'toggle'])
</script>

<template>
  <div
    class="bg-white dark:bg-slate-800 border-2 rounded-3xl p-6 shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4"
    :class="plan.is_active ? 'border-khubrat-blue/10 dark:border-slate-700 hover:border-khubrat-goldLight/70' : 'border-slate-200 dark:border-slate-800 opacity-75'"
  >
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h4 class="text-md font-extrabold text-khubrat-blue dark:text-white">{{ plan.name }}</h4>
        <span
          v-if="plan.is_active"
          class="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-white flex items-center gap-1 flex-shrink-0"
        >
          <i class="fa-solid fa-circle text-[6px]"></i> Selling
        </span>
        <span v-else class="px-3 py-1 rounded-full text-[10px] font-black bg-slate-400 text-white flex items-center gap-1 flex-shrink-0">
          <i class="fa-solid fa-circle-pause text-[6px]"></i> Paused
        </span>
      </div>

      <div class="flex items-baseline gap-1">
        <span class="text-3xl font-black text-khubrat-blue dark:text-khubrat-goldLight">${{ plan.price }}</span>
        <span class="text-xs text-slate-400 font-semibold">/ {{ plan.billing_period || 'month' }}</span>
      </div>

      <div class="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
        <i class="fa-solid fa-users text-khubrat-goldDark"></i>
        <span>Up to {{ plan.max_employees }} employees/seats allowed</span>
      </div>

      <div class="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
        <i class="fa-solid fa-tag text-khubrat-goldDark"></i>
        <span class="capitalize">{{ plan.plan_type }} plan · max {{ plan.max_uses_per_company }} use(s) per company</span>
      </div>

      <p v-if="plan.description" class="text-xs text-slate-400 leading-relaxed">{{ plan.description }}</p>
    </div>

    <div class="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
      <button
        class="text-xs font-bold transition-all px-3 py-1.5 rounded-lg border"
        :class="
          plan.is_active
            ? 'text-amber-600 border-amber-600/30 bg-amber-500/5 hover:bg-amber-500/10'
            : 'text-emerald-600 border-emerald-600/30 bg-emerald-500/5 hover:bg-emerald-500/10'
        "
        @click="$emit('toggle', plan)"
      >
        {{ plan.is_active ? 'Pause Package Sales' : 'Activate Package Sales' }}
      </button>
      <div class="flex gap-1.5">
        <button
          class="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs hover:bg-slate-200 transition-all"
          title="Edit Properties"
          @click="$emit('edit', plan)"
        >
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button
          class="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs hover:bg-rose-100 transition-all"
          title="Delete Plan"
          @click="$emit('delete', plan)"
        >
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  </div>
</template>
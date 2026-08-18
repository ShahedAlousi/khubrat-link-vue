<script setup>
const telegramBotUrl = 'https://t.me/KubratLink_support_bot'
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
    <!-- Header -->
    <h4 class="text-md font-bold text-[#002173] dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center gap-2">
      <i class="fa-solid fa-headset text-[#835c21] dark:text-[#fcd88a]"></i>
      <span>{{ $t('settings.supportTitle') }}</span>
    </h4>

    <!-- Telegram Support Card -->
    <div class="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60 rounded-xl p-6 flex flex-col items-center text-center space-y-4 transition-all">
      <!-- Icon Badge -->
      <div class="w-14 h-14 rounded-2xl bg-[#fcd88a]/20 border border-[#fcd88a]/40 flex items-center justify-center text-[#002173] dark:text-[#fcd88a] shadow-sm">
        <i class="fa-brands fa-telegram text-3xl"></i>
      </div>

      <!-- Description Text -->
      <div class="max-w-md space-y-1">
        <h5 class="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {{ $t('settings.supportHeadline') }}
        </h5>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {{ $t('settings.supportBody') }}
        </p>
      </div>

      <!-- Telegram Action Button -->
      <a
        :href="telegramBotUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center gap-2 bg-[#fcd88a] hover:bg-[#835c21] text-[#002173] hover:text-white text-xs font-bold px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 active:scale-95"
      >
        <i class="fa-brands fa-telegram text-base"></i>
        <span>{{ $t('settings.contactTelegram') }}</span>
        <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-80 ms-1"></i>
      </a>
    </div>
  </div>
</template>

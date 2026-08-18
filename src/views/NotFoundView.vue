<script setup>
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 text-center p-6">
    <h1 class="text-6xl font-black text-khubrat-blue dark:text-khubrat-goldLight">404</h1>
    <p class="text-slate-500 dark:text-slate-400">{{ $t('errors.notFoundTitle') }}</p>
    <BaseButton variant="blue" @click="router.push({ name: 'login' })">{{ $t('errors.goSignIn') }}</BaseButton>
  </div>
</template>

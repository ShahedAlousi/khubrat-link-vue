<script setup>
import { useRouter } from 'vue-router'
import BaseButton from '@/components/common/BaseButton.vue'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

async function goSignIn() {
  if (authStore.isAuthenticated) {
    await authStore.logout()
    return
  }
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 text-center p-6">
    <h1 class="text-6xl font-black text-khubrat-blue dark:text-khubrat-goldLight">403</h1>
    <p class="text-slate-500 dark:text-slate-400 max-w-md">
      You don’t have permission to access this page.
    </p>
    <BaseButton variant="blue" @click="goSignIn">Go to Sign In</BaseButton>
  </div>
</template>

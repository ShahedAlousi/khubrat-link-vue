<script setup>
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth.store'
import { initLocale } from '@/i18n/runtime'

// Applies the persisted light/dark class and language/dir as soon as the app boots.
const { initTheme } = useTheme()
const authStore = useAuthStore()
onMounted(() => {
  initTheme()
  initLocale(authStore.user?.id)
})
</script>


<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

// Applies the persisted light/dark class to <html> as soon as the app boots.
const { initTheme } = useTheme()
onMounted(initTheme)
</script>

<template>
  <router-view />
</template>

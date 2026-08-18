<!-- // AuthLayout.vue -->
<script setup>
import logo from '@/assets/full_logo.png'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  maxWidth: { type: String, default: 'max-w-md' },
  backLabel: { type: String, default: '' }
})

const emit = defineEmits(['back'])

function handleBack() {
  emit('back')
}
</script>

<template>
  <div
    class="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
    style="background: radial-gradient(circle at center, #0a2d6c 0%, #031436 100%);"
  >
    <div class="absolute top-6 inset-x-0 z-20 flex justify-center px-4">
      <LanguageSwitcher variant="auth" />
    </div>

    <div class="relative w-full flex justify-center pt-20">
      <div class="w-full" :class="maxWidth">
        <button
          v-if="backLabel"
          class="mb-4 inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold"
          type="button"
          @click="handleBack"
        >
          <i class="fa-solid fa-arrow-left rtl:rotate-180"></i>
          {{ backLabel }}
        </button>

        <div class="relative rounded-3xl p-8 sm:p-10 bg-white shadow-2xl">
          <div v-if="title" class="text-center mb-6">
            <img :src="logo" :alt="$t('auth.logoAlt')" class="mx-auto mb-4 h-24 object-contain" />
            <h1 class="text-2xl sm:text-3xl font-bold text-[#061c3f] tracking-tight">
              {{ title }}
            </h1>
            <p v-if="subtitle" class="mt-1 text-xs text-slate-500 font-medium">{{ subtitle }}</p>
          </div>

          <slot />

          <div v-if="$slots.footer" class="mt-6 text-center text-xs font-bold text-[#061c3f]">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

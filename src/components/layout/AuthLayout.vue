<!-- // AuthLayout.vue -->
<script setup>
import logo from '@/assets/full_logo.png'

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  maxWidth: { type: String, default: 'max-w-md' }, // جعل المقاس الأقصى متناسقاً بدقة ومريحاً بصرياً
  backLabel: { type: String, default: '' }
})

const emit = defineEmits(['back'])

function handleBack() {
  emit('back')
}
</script>

<template>
  <!-- تعديل الخلفية: تم إلغاء استدعاء الصورة واستبدالها بمتدرج ناعم أزرق داكن ملكي يعكس النمط العصري المستهدف -->
  <div
    class="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
    style="background: radial-gradient(circle at center, #0a2d6c 0%, #031436 100%);"
  >
    <div class="relative w-full flex justify-center">
      <div class="w-full" :class="maxWidth">
        <button
          v-if="backLabel"
          class="mb-4 inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold"
          type="button"
          @click="handleBack"
        >
          <i class="fa-solid fa-arrow-left"></i>
          {{ backLabel }}
        </button>

        <!-- الحاوية المركزية: تم تحويلها إلى اللون الأبيض الكامل المصمت (bg-white) بظلال ناعمة قوية ومطابقة تماماً للصورة المعروضة -->
        <div
          class="relative rounded-3xl p-8 sm:p-10 bg-white shadow-2xl"
        >
          <div v-if="title" class="text-center mb-6">
            <img :src="logo" alt="Khubrat Link" class="mx-auto mb-4 h-24 object-contain" />
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

<style scoped>
</style>
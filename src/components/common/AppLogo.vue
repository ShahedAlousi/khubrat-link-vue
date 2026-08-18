<script setup>
// استيراد الصورة من المسار المحلي
import logoImg from '@/assets/logo.png'

// 1. حفظ الـ props في متغير صريح لتجنب مشاكل النطاق (Scope Glitches)
const props = defineProps({
  variant: {
    type: String,
    default: 'sidebar',
    validator: (v) => ['sidebar', 'dark'].includes(v)
  },
  showText: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  }
})

const sizeMap = { 
  sm: 'w-14 h-14', 
  md: 'w-16 h-16', 
  lg: 'w-16 h-16' 
}
</script>

<template>
  <div 
    class="flex items-center transition-all duration-300" 
    :class="props.showText ? 'gap-0' : 'gap-0'"
  >
    <!-- 2. فصل الكلاسات الثابتة عن الديناميكية + وضع خيار احتياطي في حال كان الـ size غير معرف مؤقتاً -->
    <div 
      class="flex-shrink-0 transition-all duration-300"
      :class="sizeMap[props.size] || sizeMap.md"
    >
      <img 
        :src="logoImg" 
        :alt="$t('auth.logoAlt')" 
        class="w-full h-full object-contain"
      />
    </div>

    <div 
      v-show="props.showText" 
      class="overflow-hidden whitespace-nowrap transition-all duration-300"
    >
      <h1
        class="text-xl font-extrabold tracking-wider leading-tight"
        :class="props.variant === 'sidebar' ? 'text-khubrat-goldLight' : 'text-khubrat-blue'"
      >
        KHUBRAT <span class="font-black">LINK</span>
      </h1>
      <span
        class="text-xs tracking-widest font-semibold"
        :class="props.variant === 'sidebar' ? 'text-white/60' : 'text-slate-500'"
      >
        {{ $t('auth.hrPlatform') }}
      </span>
    </div>
  </div>
</template>
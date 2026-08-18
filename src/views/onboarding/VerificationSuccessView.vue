<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useOnboardingStore } from '@/stores/onboarding.store'

const router = useRouter()
const onboardingStore = useOnboardingStore()

// استرجاع الإيميل من الـ Store لعرضه وإرساله لصفحة تسجيل الدخول
const email = ref(onboardingStore.workspace.email || '')
const timer = ref(60)
let interval = null

onMounted(() => {
  if (!email.value) {
    router.replace({ name: 'signup-workspace' })
    return
  }
  startTimer()
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

function startTimer() {
  timer.value = 60
  if (interval) clearInterval(interval)
  interval = setInterval(() => {
    if (timer.value > 0) timer.value--
    else clearInterval(interval)
  }, 1000)
}

function handleResend() {
  if (timer.value > 0) return
  // PLACEHOLDER: API غير موثق حاليا لإعادة إرسال البريد
  console.log('Requesting new activation email for:', email.value)
  startTimer() // إعادة تفعيل العداد
}

function goToLogin() {
  onboardingStore.reset()
  router.push({
    name: 'login',
    query: {
      registered: 'true',
      ...(email.value ? { email: email.value } : {})
    }
  })
}
</script>

<template>
  <AuthLayout
    :title="$t('onboarding.workspaceCreated')"
    max-width="max-w-lg"
  >
    <div class="text-center space-y-6">
      <div class="mx-auto w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mb-4">
        <i class="fa-solid fa-check"></i>
      </div>
      
      <p class="text-slate-700 text-lg font-medium leading-relaxed dark:text-slate-200">
        {{ $t('onboarding.workspaceCreatedBody') }}
      </p>

      <div class="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
        <p class="text-sm text-slate-600 mb-1">{{ $t('onboarding.activationSent') }}</p>
        <p class="font-bold text-khubrat-blue text-lg">{{ email }}</p>
      </div>

      <div class="pt-4 flex flex-col gap-3">
        <BaseButton @click="goToLogin" variant="gold" full-width>
          {{ $t('onboarding.goLogin') }}
        </BaseButton>
        
        <!-- <BaseButton 
          @click="handleResend" 
          variant="ghost" 
          full-width 
          :disabled="timer > 0"
        >
          <span v-if="timer > 0">إعادة إرسال البريد بعد ({{ timer }} ثانية)</span>
          <span v-else><i class="fa-solid fa-rotate-right mr-2"></i> إعادة إرسال البريد</span>
        </BaseButton> -->
      </div>
    </div>
  </AuthLayout>
</template>

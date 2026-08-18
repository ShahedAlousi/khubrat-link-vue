<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { isValidEmail, isRequired } from '@/utils/validators'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  password: ''
})
const fieldErrors = reactive({ email: '', password: '' })
const submitError = ref('')
const submitting = ref(false)

const justRegistered = computed(() => route.query.registered === 'true')
const justReset = computed(() => route.query.reset === 'true')

onMounted(() => {
  if (typeof route.query.email === 'string' && route.query.email) {
    form.email = route.query.email
  }
})

function validate() {
  fieldErrors.email = isValidEmail(form.email) ? '' : t('validation.email')
  fieldErrors.password = isRequired(form.password) ? '' : t('validation.passwordRequired')
  return !fieldErrors.email && !fieldErrors.password
}

async function handleSubmit() {
  submitError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    await authStore.login({ email: form.email, password: form.password })

    if (authStore.mustChangePassword) {
      router.push({ name: 'complete-first-login' })
      return
    }

    if (!authStore.hasWebConsoleAccess) {
      router.push({ name: 'forbidden' })
      return
    }

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    const home = authStore.isCompanyUser
      ? authStore.isDepartmentManager
        ? { name: 'company-requests' }
        : authStore.canManagePolicies
          ? { name: 'company-policies' }
          : { name: 'company-dashboard' }
      : { name: 'dashboard-overview' }
    router.push(redirect || home)
  } catch (err) {
    submitError.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout :title="$t('auth.welcomeBack')" :subtitle="$t('auth.loginSubtitle')">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <BaseAlert v-if="justRegistered" variant="success">
        {{ $t('auth.registeredSuccess') }}
      </BaseAlert>
      <BaseAlert v-if="justReset" variant="success">{{ $t('auth.resetSuccess') }}</BaseAlert>
      <BaseAlert v-if="submitError" variant="error">{{ submitError }}</BaseAlert>

      <BaseInput
        v-model="form.email"
        type="email"
        :label="$t('auth.email')"
        placeholder="hr@khibrat.com"
        autocomplete="username"
        required
        :error="fieldErrors.email"
      />
      <BaseInput
        v-model="form.password"
        type="password"
        :label="$t('auth.password')"
        placeholder="••••••"
        autocomplete="current-password"
        required
        :error="fieldErrors.password"
      />

      <div class="flex justify-end -mt-1">
        <router-link :to="{ name: 'forgot-password' }" class="text-xs font-bold text-[#bd8a39] hover:underline">
          {{ $t('auth.forgotPassword') }}
        </router-link>
      </div>

      <BaseButton type="submit" variant="gold" full-width :loading="submitting">{{ $t('auth.signIn') }}</BaseButton>

      <p class="text-center text-xs text-slate-500 font-semibold">
        {{ $t('auth.noWorkspace') }}
        <router-link :to="{ name: 'signup-workspace' }" class="font-bold text-[#bd8a39] hover:underline">
          {{ $t('auth.createOne') }}
        </router-link>
      </p>
    </form>

    <template #footer>
      <span class="text-slate-500">{{ $t('auth.encounteredProblem') }} </span>
      <a href="mailto:support@khubratlink.com" class="font-bold text-[#061c3f] underline hover:opacity-80">{{ $t('auth.contactSupport') }}</a>
    </template>
  </AuthLayout>
</template>

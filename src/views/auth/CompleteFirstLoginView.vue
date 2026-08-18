<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { minLength } from '@/utils/validators'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ password: '', confirmPassword: '' })
const fieldErrors = reactive({ password: '', confirmPassword: '' })
const submitError = ref('')
const submitting = ref(false)

function validate() {
  fieldErrors.password = minLength(form.password, 8) ? '' : t('validation.passwordMin')
  fieldErrors.confirmPassword = form.confirmPassword === form.password ? '' : t('validation.passwordsMismatch')
  return !fieldErrors.password && !fieldErrors.confirmPassword
}

async function handleSubmit() {
  submitError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    await authStore.completeFirstLogin({
      password: form.password,
      password_confirmation: form.confirmPassword
    })

    if (!authStore.hasWebConsoleAccess) {
      router.push({ name: 'forbidden' })
      return
    }

    if (authStore.isCompanyUser) {
      router.push(
        authStore.isDepartmentManager
          ? { name: 'company-requests' }
          : authStore.canManagePolicies
            ? { name: 'company-policies' }
            : { name: 'company-dashboard' }
      )
      return
    }

    router.push({ name: 'dashboard-overview' })
  } catch (err) {
    submitError.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout
    :title="$t('auth.firstLoginTitle')"
    :subtitle="$t('auth.firstLoginSubtitle')"
  >
    <form class="space-y-5" @submit.prevent="handleSubmit">
      <BaseAlert v-if="submitError" variant="error">{{ submitError }}</BaseAlert>

      <BaseInput
        v-model="form.password"
        type="password"
        :label="$t('auth.newPassword')"
        placeholder="••••••••"
        autocomplete="new-password"
        required
        :error="fieldErrors.password"
      />
      <BaseInput
        v-model="form.confirmPassword"
        type="password"
        :label="$t('auth.confirmPassword')"
        placeholder="••••••••"
        autocomplete="new-password"
        required
        :error="fieldErrors.confirmPassword"
      />

      <BaseButton type="submit" variant="gold" full-width :loading="submitting">{{ $t('auth.continueDashboard') }}</BaseButton>
    </form>
  </AuthLayout>
</template>

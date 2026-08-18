<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { minLength } from '@/utils/validators'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// The reset link emailed to the user is expected to carry these as query params.
const email = String(route.query.email || '')
const token = String(route.query.token || '')

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
    await authStore.resetPassword({ email, token, password: form.password })
    router.push({ name: 'login', query: { reset: 'true' } })
  } catch (err) {
    submitError.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout :title="$t('auth.resetTitle')" :subtitle="$t('auth.resetSubtitle')">
    <BaseAlert v-if="!email || !token" variant="error" class="mb-5">
      {{ $t('auth.resetInvalid') }}
    </BaseAlert>

    <form v-else class="space-y-5" @submit.prevent="handleSubmit">
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

      <BaseButton type="submit" variant="gold" full-width :loading="submitting">{{ $t('auth.updatePassword') }}</BaseButton>
    </form>

    <template #footer>
      {{ $t('auth.encounteredProblem') }}
      <a href="mailto:support@khubratlink.com" class="font-bold underline">{{ $t('auth.contactSupport') }}</a>
    </template>
  </AuthLayout>
</template>

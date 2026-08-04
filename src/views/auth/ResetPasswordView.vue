<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { minLength } from '@/utils/validators'

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
  fieldErrors.password = minLength(form.password, 8) ? '' : 'Password must be at least 8 characters.'
  fieldErrors.confirmPassword = form.confirmPassword === form.password ? '' : 'Passwords do not match.'
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
  <AuthLayout title="Reset Your Password" subtitle="Choose a new password for your account.">
    <BaseAlert v-if="!email || !token" variant="error" class="mb-5">
      This reset link is missing or invalid. Please request a new one.
    </BaseAlert>

    <form v-else class="space-y-5" @submit.prevent="handleSubmit">
      <BaseAlert v-if="submitError" variant="error">{{ submitError }}</BaseAlert>

      <BaseInput
        v-model="form.password"
        type="password"
        label="New Password"
        placeholder="••••••••"
        autocomplete="new-password"
        required
        :error="fieldErrors.password"
      />
      <BaseInput
        v-model="form.confirmPassword"
        type="password"
        label="Confirm New Password"
        placeholder="••••••••"
        autocomplete="new-password"
        required
        :error="fieldErrors.confirmPassword"
      />

      <BaseButton type="submit" variant="gold" full-width :loading="submitting">Update Password</BaseButton>
    </form>

    <template #footer>
      Encountered a problem?
      <a href="mailto:support@khubratlink.com" class="font-bold underline">Contact technical support.</a>
    </template>
  </AuthLayout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { isValidEmail, isRequired } from '@/utils/validators'

const router = useRouter()
const onboardingStore = useOnboardingStore()

const form = reactive({
  name: onboardingStore.workspace.name,
  email: onboardingStore.workspace.email,
  acceptedTerms: false
})

const fieldErrors = reactive({ name: '', email: '', acceptedTerms: '' })

function validate() {
  fieldErrors.name = isRequired(form.name) ? '' : 'Company name is required.'
  fieldErrors.email = isValidEmail(form.email) ? '' : 'Enter a valid company email.'
  fieldErrors.acceptedTerms = form.acceptedTerms ? '' : 'You must accept the Terms of Use to continue.'
  return !fieldErrors.name && !fieldErrors.email && !fieldErrors.acceptedTerms
}

function handleSubmit() {
  if (!validate()) return
  onboardingStore.setWorkspaceStep({ name: form.name, email: form.email })
  router.push({ name: 'signup-plan' })
}
</script>

<template>
  <AuthLayout
    title="Create Your Free Workspace"
    max-width="max-w-lg"
    back-label="Go Back"
    @back="router.push({ name: 'login' })"
  >
    <form class="space-y-5" @submit.prevent="handleSubmit">
      <BaseInput v-model="form.name" label="Company Name" required :error="fieldErrors.name" />
      <BaseInput v-model="form.email" type="email" label="Company Email" required :error="fieldErrors.email" />

      <label class="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
        <input v-model="form.acceptedTerms" type="checkbox" class="mt-1 rounded border-slate-300" />
        <span>
          I agree to the Terms of Use and Privacy Policy of the Khubrat System.
          <a href="#" class="underline font-semibold">Read more</a>
        </span>
      </label>
      <p v-if="fieldErrors.acceptedTerms" class="text-xs font-semibold text-rose-500 -mt-3">
        {{ fieldErrors.acceptedTerms }}
      </p>

      <BaseButton type="submit" variant="gold" full-width>Continue</BaseButton>

      <p class="text-center text-sm text-slate-600 dark:text-slate-300">
        Already have a workspace?
        <router-link :to="{ name: 'login' }" class="font-bold text-khubrat-blue dark:text-khubrat-goldLight hover:underline">
          Sign in
        </router-link>
      </p>
    </form>
  </AuthLayout>
</template>

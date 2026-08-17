<!-- // Login.vue -->
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { isValidEmail, isRequired } from '@/utils/validators'

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
  fieldErrors.email = isValidEmail(form.email) ? '' : 'Enter a valid email address.'
  fieldErrors.password = isRequired(form.password) ? '' : 'Password is required.'
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
  <AuthLayout title="Welcome Back" subtitle="Sign in to your Khubrat Link dashboard">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <BaseAlert v-if="justRegistered" variant="success">
        Your workspace has been created! Check your company email for login credentials.
      </BaseAlert>
      <BaseAlert v-if="justReset" variant="success"> Your password has been updated. Please sign in. </BaseAlert>
      <BaseAlert v-if="submitError" variant="error">{{ submitError }}</BaseAlert>

      <BaseInput
        v-model="form.email"
        type="email"
        label="Email Address"
        placeholder="hr@khibrat.com"
        autocomplete="username"
        required
        :error="fieldErrors.email"
      />
      <BaseInput
        v-model="form.password"
        type="password"
        label="Password"
        placeholder="••••••"
        autocomplete="current-password"
        required
        :error="fieldErrors.password"
      />

      <!-- تعديل: لون رابط استعادة كلمة المرور تم تحويله للذهبي الدافئ تماشياً مع الصورة -->
      <div class="flex justify-end -mt-1">
        <router-link :to="{ name: 'forgot-password' }" class="text-xs font-bold text-[#bd8a39] hover:underline">
          Forgot password?
        </router-link>
      </div>

      <BaseButton type="submit" variant="gold" full-width :loading="submitting">Sign In</BaseButton>

      <!-- تعديل: ألوان نصوص الانضمام وأسفل النموذج لتكون رمادية ناعمة والذهبي للرابط المفتاحي -->
      <p class="text-center text-xs text-slate-500 font-semibold">
        Don't have a workspace?
        <router-link :to="{ name: 'signup-workspace' }" class="font-bold text-[#bd8a39] hover:underline">
          Create one
        </router-link>
      </p>
    </form>

    <template #footer>
      <span class="text-slate-500">Encountered a problem? </span>
      <a href="mailto:support@khubratlink.com" class="font-bold text-[#061c3f] underline hover:opacity-80">Contact technical support.</a>
    </template>
  </AuthLayout>
</template>
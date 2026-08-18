<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCompanyProfileStore } from '@/stores/companyProfileStore'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { isRequired, isValidEmail } from '@/utils/validators'
import { toMediaUrl } from '@/utils/format'

const { t } = useI18n()
const profileStore = useCompanyProfileStore()

const logoInputRef = ref(null)
const selectedLogoFile = ref(null)
const logoPreviewUrl = ref(null)
const persistedLogoBlobUrl = ref(null)
const logoFilename = ref('')
const flash = ref('')

const fieldErrors = reactive({})

const editHeading = computed(() =>
  profileStore.isProfileComplete ? t('profile.editTitle') : t('profile.setupTitle')
)

const logoCacheKey = ref(0)

function resolveLogoUrl(logoUrl, companyId) {
  if (!logoUrl) return ''
  return toMediaUrl(logoUrl, logoCacheKey.value || '', { companyId })
}

const displayLogoUrl = computed(() => {
  if (logoPreviewUrl.value) return logoPreviewUrl.value
  if (persistedLogoBlobUrl.value) return persistedLogoBlobUrl.value
  if (profileStore.profile.logo_url) {
    return resolveLogoUrl(profileStore.profile.logo_url, profileStore.profile.id)
  }
  return fallbackLogoUrl(profileStore.profile.name)
})

const editLogoUrl = computed(() => {
  if (logoPreviewUrl.value) return logoPreviewUrl.value
  if (persistedLogoBlobUrl.value) return persistedLogoBlobUrl.value
  const savedLogo = profileStore.draftProfile.logo_url || profileStore.profile.logo_url
  const companyId = profileStore.draftProfile.id || profileStore.profile.id
  if (savedLogo) return resolveLogoUrl(savedLogo, companyId)
  return fallbackLogoUrl(profileStore.draftProfile.name)
})

const aboutCharCount = computed(() => (profileStore.draftProfile.about || '').length)

function fallbackLogoUrl(name) {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name || 'Khubrat')}`
}

function display(value, fallback) {
  return value === null || value === undefined || value === ''
    ? (fallback ?? t('common.notSpecified'))
    : value
}

function setPersistedLogoBlob(file) {
  if (!file) return
  if (persistedLogoBlobUrl.value) URL.revokeObjectURL(persistedLogoBlobUrl.value)
  persistedLogoBlobUrl.value = URL.createObjectURL(file)
}

function clearPersistedLogoBlob() {
  if (persistedLogoBlobUrl.value) {
    URL.revokeObjectURL(persistedLogoBlobUrl.value)
    persistedLogoBlobUrl.value = null
  }
}

onBeforeUnmount(() => {
  if (logoPreviewUrl.value) URL.revokeObjectURL(logoPreviewUrl.value)
  clearPersistedLogoBlob()
})

onMounted(async () => {
  try {
    await profileStore.fetchProfile()
    resetLogoSelection(false)
  } catch {
    // error surfaced via store
  }
})

watch(
  () => profileStore.isEditing,
  (editing) => {
    if (editing) {
      Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
      resetLogoSelection(false)
    }
  }
)

function resetLogoSelection(clearPreview = true) {
  selectedLogoFile.value = null
  if (logoInputRef.value) logoInputRef.value.value = ''
  if (clearPreview && logoPreviewUrl.value) {
    URL.revokeObjectURL(logoPreviewUrl.value)
    logoPreviewUrl.value = null
  }
  logoFilename.value = profileStore.profile.logo_url
    ? t('profile.currentLogoLoaded')
    : t('profile.omitFile')
}

function handleLogoError(event, name) {
  if (persistedLogoBlobUrl.value) {
    event.target.src = persistedLogoBlobUrl.value
    return
  }
  event.target.src = fallbackLogoUrl(name)
}

function triggerLogoUpload() {
  logoInputRef.value?.click()
}

function handleLogoChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    profileStore.error = t('validation.logoType')
    event.target.value = ''
    return
  }

  if (file.size > 4 * 1024 * 1024) {
    profileStore.error = t('validation.logoSize')
    event.target.value = ''
    return
  }

  selectedLogoFile.value = file
  logoFilename.value = t('profile.selectedFile', {
    file: file.name,
    size: (file.size / 1024).toFixed(1)
  })
  logoPreviewUrl.value = URL.createObjectURL(file)
  profileStore.error = null
}

function clearLogoSelection() {
  selectedLogoFile.value = null
  if (logoPreviewUrl.value) {
    URL.revokeObjectURL(logoPreviewUrl.value)
    logoPreviewUrl.value = null
  }
  if (logoInputRef.value) logoInputRef.value.value = ''
  logoFilename.value = t('profile.logoCleared')
}

function validateForm() {
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  const draft = profileStore.draftProfile

  if (!isRequired(draft.name)) fieldErrors.name = t('validation.companyNameRequired')
  if (!isValidEmail(draft.email)) fieldErrors.email = t('validation.email')
  if (!isRequired(draft.phone)) fieldErrors.phone = t('validation.phoneRequired')
  if (!isRequired(draft.address)) fieldErrors.address = t('validation.addressRequired')

  if (draft.about && draft.about.length > 3000) {
    fieldErrors.about = t('validation.aboutMax')
  }

  return Object.keys(fieldErrors).length === 0
}

async function handleSubmit() {
  profileStore.error = null
  flash.value = ''
  if (!validateForm()) return

  try {
    const uploadedFile = selectedLogoFile.value
    await profileStore.saveProfile(uploadedFile)
    logoCacheKey.value = Date.now()
    if (uploadedFile) setPersistedLogoBlob(uploadedFile)
    resetLogoSelection(true)
    flash.value = t('profile.updated')
  } catch (err) {
    if (err.errors && typeof err.errors === 'object') {
      Object.entries(err.errors).forEach(([key, value]) => {
        fieldErrors[key] = Array.isArray(value) ? value[0] : String(value)
      })
    }
  }
}

function handleCancel() {
  const cancelled = profileStore.cancelEdit()
  if (!cancelled) {
    profileStore.error = t('profile.fillInitial')
    return
  }
  resetLogoSelection(true)
  profileStore.error = null
}
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <BaseAlert v-if="flash" variant="success">
      {{ flash }}
      <button class="ms-2 underline text-xs" @click="flash = ''">{{ $t('common.dismiss') }}</button>
    </BaseAlert>
    <BaseAlert v-if="profileStore.error" variant="error">{{ profileStore.error }}</BaseAlert>

    <LoadingSpinner v-if="profileStore.isLoading" />

    <template v-else>
      <!-- VIEW MODE -->
      <div v-if="!profileStore.isEditing" class="space-y-6">
        <div
          class="relative rounded-3xl gradient-brand p-8 text-white shadow-xl overflow-hidden border border-khubrat-goldDark/30"
        >
          <div
            class="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-khubrat-goldLight/10 blur-3xl pointer-events-none"
          ></div>

          <div
            class="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6"
          >
            <div class="flex flex-col md:flex-row items-center md:items-center gap-6 text-center md:text-start">
              <div
                class="w-28 h-28 rounded-2xl bg-white dark:bg-slate-800 p-2 border-2 border-khubrat-goldLight shadow-lg flex items-center justify-center shrink-0 overflow-hidden"
              >
                <img
                  :src="displayLogoUrl"
                  :alt="$t('profile.logoAlt')"
                  referrerpolicy="no-referrer"
                  class="max-w-full max-h-full object-contain rounded-xl"
                  @error="handleLogoError($event, profileStore.profile.name)"
                />
              </div>

              <div class="space-y-1.5">
                <div class="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h3 class="text-2xl font-black text-khubrat-goldLight">
                    {{ display(profileStore.profile.name, $t('profile.nameUnset')) }}
                  </h3>
                  <span
                    class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5"
                  >
                    <i class="fa-solid fa-circle-check"></i> {{ $t('profile.verifiedTenant') }}
                  </span>
                </div>
                <p class="text-xs text-slate-200 font-semibold italic">
                  {{ display(profileStore.profile.tagline, $t('profile.noTagline')) }}
                </p>
                <p class="text-[11px] text-white/50 flex items-center justify-center md:justify-start gap-2 pt-1">
                  <i class="fa-solid fa-fingerprint text-khubrat-goldLight"></i>
                  <span>
                    {{ $t('profile.tenantId') }}
                    <span class="font-mono text-slate-300">{{ profileStore.profile.id || $t('common.nA') }}</span>
                  </span>
                </p>
              </div>
            </div>

            <BaseButton variant="gold" class="shrink-0 !rounded-2xl" @click="profileStore.enableEditMode()">
              <i class="fa-solid fa-pen-to-square"></i>
              {{ $t('profile.editProfile') }}
            </BaseButton>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4"
          >
            <div
              class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0"
            >
              <i class="fa-solid fa-envelope"></i>
            </div>
            <div class="space-y-1 min-w-0">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">{{ $t('profile.officialEmail') }}</span>
              <h5 class="text-xs font-bold text-slate-800 dark:text-white truncate">
                {{ display(profileStore.profile.email) }}
              </h5>
              <p class="text-[10px] text-slate-400">{{ $t('profile.officialEmailHint') }}</p>
            </div>
          </div>

          <div
            class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4"
          >
            <div
              class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0"
            >
              <i class="fa-solid fa-phone"></i>
            </div>
            <div class="space-y-1 min-w-0">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">{{ $t('onboarding.phone') }}</span>
              <h5 class="text-xs font-bold text-slate-800 dark:text-white truncate">
                {{ display(profileStore.profile.phone) }}
              </h5>
              <p class="text-[10px] text-slate-400">{{ $t('profile.phoneHint') }}</p>
            </div>
          </div>

          <div
            class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4"
          >
            <div
              class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0"
            >
              <i class="fa-solid fa-location-dot"></i>
            </div>
            <div class="space-y-1 min-w-0">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                {{ $t('profile.hqAddress') }}
              </span>
              <h5 class="text-xs font-bold text-slate-800 dark:text-white truncate">
                {{ display(profileStore.profile.address) }}
              </h5>
              <p class="text-[10px] text-slate-400">{{ $t('profile.hqHint') }}</p>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4"
        >
          <div class="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <i class="fa-solid fa-building-user text-khubrat-blue dark:text-khubrat-goldLight text-lg"></i>
            <h4 class="text-sm font-black text-khubrat-blue dark:text-khubrat-goldLight uppercase tracking-wider">
              {{ $t('profile.about') }}
            </h4>
          </div>
          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {{ display(profileStore.profile.about, $t('profile.noDescription')) }}
          </p>
        </div>
      </div>

      <!-- EDIT MODE -->
      <div
        v-else
        class="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg p-8 space-y-8"
      >
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-700"
        >
          <div>
            <h3 class="text-lg font-black text-khubrat-blue dark:text-khubrat-goldLight flex items-center gap-2">
              <i class="fa-solid fa-sliders"></i>
              <span>{{ editHeading }}</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">
              {{ $t('profile.gmAuth') }}
            </p>
          </div>
          <span
            class="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <i class="fa-solid fa-user-shield"></i> {{ $t('profile.gmRestricted') }}
          </span>
        </div>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Logo Upload -->
          <div class="space-y-2">
            <label class="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>{{ $t('profile.companyLogo') }}</span>
              <span class="text-[10px] text-slate-400 font-normal">{{ $t('profile.logoHint') }}</span>
            </label>
            <div
              class="flex flex-col sm:flex-row items-center gap-6 p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 hover:border-khubrat-goldDark transition-all"
            >
              <div
                class="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center shrink-0 shadow-xs overflow-hidden"
              >
                <img
                  :src="editLogoUrl"
                  :alt="$t('profile.logoPreview')"
                  referrerpolicy="no-referrer"
                  class="max-w-full max-h-full object-contain rounded-lg"
                  @error="handleLogoError($event, profileStore.draftProfile.name)"
                />
              </div>

              <div class="flex-1 space-y-2 text-center sm:text-start">
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <button
                    type="button"
                    class="px-4 py-2 bg-khubrat-blue dark:bg-khubrat-goldLight text-white dark:text-khubrat-blue rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
                    @click="triggerLogoUpload"
                  >
                    <i class="fa-solid fa-cloud-arrow-up"></i> {{ $t('profile.uploadLogo') }}
                  </button>
                  <button
                    type="button"
                    class="px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                    @click="clearLogoSelection"
                  >
                    {{ $t('profile.removeSelection') }}
                  </button>
                </div>
                <input
                  ref="logoInputRef"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  class="hidden"
                  @change="handleLogoChange"
                />
                <p class="text-[11px] text-slate-400">{{ logoFilename }}</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput
              v-model="profileStore.draftProfile.name"
              :label="$t('onboarding.companyName')"
              :placeholder="$t('profile.namePlaceholder')"
              required
              :error="fieldErrors.name"
            />
            <BaseInput
              v-model="profileStore.draftProfile.tagline"
              :label="$t('profile.tagline')"
              :placeholder="$t('profile.taglinePlaceholder')"
              :error="fieldErrors.tagline"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput
              v-model="profileStore.draftProfile.email"
              :label="$t('profile.officialEmailAddress')"
              type="email"
              placeholder="info@company.com"
              required
              :error="fieldErrors.email"
            />
            <BaseInput
              v-model="profileStore.draftProfile.phone"
              :label="$t('onboarding.phone')"
              placeholder="+963111222333"
              required
              :error="fieldErrors.phone"
            />
          </div>

          <BaseInput
            v-model="profileStore.draftProfile.address"
            :label="$t('profile.hqPhysical')"
            :placeholder="$t('profile.addressPlaceholder')"
            required
            :error="fieldErrors.address"
          />

          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <label class="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                {{ $t('profile.about') }} / {{ $t('profile.briefOverview') }}
              </label>
              <span class="text-[10px] text-slate-400 font-bold">{{ $t('common.charactersCount', { n: aboutCharCount, max: 3000 }) }}</span>
            </div>
            <textarea
              v-model="profileStore.draftProfile.about"
              rows="4"
              maxlength="3000"
              :placeholder="$t('profile.aboutPlaceholder')"
              class="w-full bg-white dark:bg-slate-900 border rounded-xl px-4 py-3 text-sm transition-all duration-150 outline-none border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:border-[#bd8a39] hover:ring-4 hover:ring-[#bd8a39]/20 focus:border-[#bd8a39] focus:ring-4 focus:ring-[#bd8a39]/30"
              :class="fieldErrors.about ? 'border-rose-500' : ''"
            ></textarea>
            <p v-if="fieldErrors.about" class="text-xs font-semibold text-rose-500">{{ fieldErrors.about }}</p>
          </div>

          <div class="pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
            <BaseButton
              v-if="profileStore.isProfileComplete"
              type="button"
              variant="ghost"
              @click="handleCancel"
            >
              {{ $t('common.cancel') }}
            </BaseButton>
            <BaseButton type="submit" variant="blue" :loading="profileStore.isSaving">
              <i class="fa-solid fa-floppy-disk"></i>
              {{ $t('profile.saveProfile') }}
            </BaseButton>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

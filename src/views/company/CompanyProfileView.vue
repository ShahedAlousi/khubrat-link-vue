<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useCompanyProfileStore } from '@/stores/companyProfileStore'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { isRequired, isValidEmail } from '@/utils/validators'

const profileStore = useCompanyProfileStore()

const logoInputRef = ref(null)
const selectedLogoFile = ref(null)
const logoPreviewUrl = ref(null)
const logoFilename = ref('')
const flash = ref('')

const fieldErrors = reactive({})

const editHeading = computed(() =>
  profileStore.isProfileComplete
    ? 'Edit Corporate Profile Information'
    : 'Initial Corporate Profile Setup'
)

const displayLogoUrl = computed(() => {
  if (logoPreviewUrl.value) return logoPreviewUrl.value
  if (profileStore.profile.logo_url) return profileStore.profile.logo_url
  return fallbackLogoUrl(profileStore.profile.name)
})

const editLogoUrl = computed(() => {
  if (logoPreviewUrl.value) return logoPreviewUrl.value
  if (profileStore.profile.logo_url) return profileStore.profile.logo_url
  return fallbackLogoUrl(profileStore.draftProfile.name)
})

const aboutCharCount = computed(() => (profileStore.draftProfile.about || '').length)

function fallbackLogoUrl(name) {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name || 'Khubrat')}`
}

function display(value, fallback = 'Not specified') {
  return value === null || value === undefined || value === '' ? fallback : value
}

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
  if (clearPreview) logoPreviewUrl.value = null
  logoFilename.value = profileStore.profile.logo_url
    ? 'Current logo loaded. Choose a file to replace it.'
    : 'Omit file to keep current saved corporate logo.'
}

function triggerLogoUpload() {
  logoInputRef.value?.click()
}

function handleLogoChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    profileStore.error = 'Logo must be a JPG, PNG, or WEBP image.'
    event.target.value = ''
    return
  }

  if (file.size > 4 * 1024 * 1024) {
    profileStore.error = 'Logo file size exceeds the maximum limit of 4MB.'
    event.target.value = ''
    return
  }

  selectedLogoFile.value = file
  logoFilename.value = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
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
  logoFilename.value = 'Logo file selection cleared.'
}

function validateForm() {
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  const draft = profileStore.draftProfile

  if (!isRequired(draft.name)) fieldErrors.name = 'Company name is required.'
  if (!isValidEmail(draft.email)) fieldErrors.email = 'Enter a valid email address.'
  if (!isRequired(draft.phone)) fieldErrors.phone = 'Phone number is required.'
  if (!isRequired(draft.address)) fieldErrors.address = 'Address is required.'

  if (draft.about && draft.about.length > 3000) {
    fieldErrors.about = 'About section cannot exceed 3000 characters.'
  }

  return Object.keys(fieldErrors).length === 0
}

async function handleSubmit() {
  profileStore.error = null
  flash.value = ''
  if (!validateForm()) return

  try {
    await profileStore.saveProfile(selectedLogoFile.value)
    resetLogoSelection(true)
    flash.value = 'Company profile updated successfully.'
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
    profileStore.error = 'Please fill in and save the initial profile information.'
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
      <button class="ml-2 underline text-xs" @click="flash = ''">Dismiss</button>
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
            <div class="flex flex-col md:flex-row items-center md:items-center gap-6 text-center md:text-left">
              <div
                class="w-28 h-28 rounded-2xl bg-white dark:bg-slate-800 p-2 border-2 border-khubrat-goldLight shadow-lg flex items-center justify-center shrink-0 overflow-hidden"
              >
                <img
                  :src="displayLogoUrl"
                  alt="Company Logo"
                  class="max-w-full max-h-full object-contain rounded-xl"
                  @error="($event.target.src = fallbackLogoUrl(profileStore.profile.name))"
                />
              </div>

              <div class="space-y-1.5">
                <div class="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h3 class="text-2xl font-black text-khubrat-goldLight">
                    {{ display(profileStore.profile.name, 'Company Name Unset') }}
                  </h3>
                  <span
                    class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5"
                  >
                    <i class="fa-solid fa-circle-check"></i> Verified Tenant
                  </span>
                </div>
                <p class="text-xs text-slate-200 font-semibold italic">
                  {{ display(profileStore.profile.tagline, 'No tagline provided') }}
                </p>
                <p class="text-[11px] text-white/50 flex items-center justify-center md:justify-start gap-2 pt-1">
                  <i class="fa-solid fa-fingerprint text-khubrat-goldLight"></i>
                  <span>
                    Tenant ID:
                    <span class="font-mono text-slate-300">{{ profileStore.profile.id || 'N/A' }}</span>
                  </span>
                </p>
              </div>
            </div>

            <BaseButton variant="gold" class="shrink-0 !rounded-2xl" @click="profileStore.enableEditMode()">
              <i class="fa-solid fa-pen-to-square"></i>
              Edit Profile Information
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
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Official Email</span>
              <h5 class="text-xs font-bold text-slate-800 dark:text-white truncate">
                {{ display(profileStore.profile.email) }}
              </h5>
              <p class="text-[10px] text-slate-400">Primary corporate contact email</p>
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
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phone Number</span>
              <h5 class="text-xs font-bold text-slate-800 dark:text-white truncate">
                {{ display(profileStore.profile.phone) }}
              </h5>
              <p class="text-[10px] text-slate-400">Direct support hotline</p>
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
                Headquarters Address
              </span>
              <h5 class="text-xs font-bold text-slate-800 dark:text-white truncate">
                {{ display(profileStore.profile.address) }}
              </h5>
              <p class="text-[10px] text-slate-400">Physical registered location</p>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4"
        >
          <div class="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <i class="fa-solid fa-building-user text-khubrat-blue dark:text-khubrat-goldLight text-lg"></i>
            <h4 class="text-sm font-black text-khubrat-blue dark:text-khubrat-goldLight uppercase tracking-wider">
              About The Company
            </h4>
          </div>
          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {{ display(profileStore.profile.about, 'No detailed description added yet.') }}
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
              General Manager authorization required. Changes take effect immediately across all system modules.
            </p>
          </div>
          <span
            class="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <i class="fa-solid fa-user-shield"></i> GM Restricted Access
          </span>
        </div>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Logo Upload -->
          <div class="space-y-2">
            <label class="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Company Logo</span>
              <span class="text-[10px] text-slate-400 font-normal">(jpg, png, webp — Max 4MB)</span>
            </label>
            <div
              class="flex flex-col sm:flex-row items-center gap-6 p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 hover:border-khubrat-goldDark transition-all"
            >
              <div
                class="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center shrink-0 shadow-xs overflow-hidden"
              >
                <img
                  :src="editLogoUrl"
                  alt="Logo Preview"
                  class="max-w-full max-h-full object-contain rounded-lg"
                  @error="($event.target.src = fallbackLogoUrl(profileStore.draftProfile.name))"
                />
              </div>

              <div class="flex-1 space-y-2 text-center sm:text-left">
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <button
                    type="button"
                    class="px-4 py-2 bg-khubrat-blue dark:bg-khubrat-goldLight text-white dark:text-khubrat-blue rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2"
                    @click="triggerLogoUpload"
                  >
                    <i class="fa-solid fa-cloud-arrow-up"></i> Upload New Logo
                  </button>
                  <button
                    type="button"
                    class="px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                    @click="clearLogoSelection"
                  >
                    Remove Selection
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
              label="Company Name"
              placeholder="e.g. Khubrat HR Solutions"
              required
              :error="fieldErrors.name"
            />
            <BaseInput
              v-model="profileStore.draftProfile.tagline"
              label="Company Tagline / Slogan"
              placeholder="e.g. Your Certified Digital Empowerment Partner"
              :error="fieldErrors.tagline"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput
              v-model="profileStore.draftProfile.email"
              label="Official Email Address"
              type="email"
              placeholder="info@company.com"
              required
              :error="fieldErrors.email"
            />
            <BaseInput
              v-model="profileStore.draftProfile.phone"
              label="Phone Number"
              placeholder="+963111222333"
              required
              :error="fieldErrors.phone"
            />
          </div>

          <BaseInput
            v-model="profileStore.draftProfile.address"
            label="Headquarters Physical Address"
            placeholder="e.g. Damascus, Al-Rawda District"
            required
            :error="fieldErrors.address"
          />

          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <label class="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                About The Company / Brief Overview
              </label>
              <span class="text-[10px] text-slate-400 font-bold">{{ aboutCharCount }} / 3000 characters</span>
            </div>
            <textarea
              v-model="profileStore.draftProfile.about"
              rows="4"
              maxlength="3000"
              placeholder="Write a summary about your company's sector, mission, and operational domain..."
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
              Cancel
            </BaseButton>
            <BaseButton type="submit" variant="blue" :loading="profileStore.isSaving">
              <i class="fa-solid fa-floppy-disk"></i>
              Save Profile Changes
            </BaseButton>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

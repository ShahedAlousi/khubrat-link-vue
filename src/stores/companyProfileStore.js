import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import companyProfileService from '@/services/companyProfileService'

const emptyProfile = () => ({
  id: null,
  name: '',
  logo_url: null,
  tagline: '',
  about: '',
  phone: '',
  email: '',
  address: ''
})

export const useCompanyProfileStore = defineStore('companyProfile', () => {
  const profile = ref(emptyProfile())
  const draftProfile = ref(emptyProfile())

  const isEditing = ref(false)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref(null)
  const hasFetchedProfile = ref(false)

  const isProfileComplete = computed(() =>
    Boolean(profile.value.name?.trim() && profile.value.email?.trim())
  )

  function applyProfileData(data) {
    const normalized = { ...emptyProfile(), ...data }
    profile.value = normalized
    draftProfile.value = { ...normalized }
  }

  async function fetchProfile() {
    isLoading.value = true
    error.value = null
    try {
      const response = await companyProfileService.getProfile()
      applyProfileData(response.data)
      hasFetchedProfile.value = true

      if (!isProfileComplete.value) {
        isEditing.value = true
      }

      return profile.value
    } catch (err) {
      error.value = err.message || 'Failed to load company profile.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function enableEditMode() {
    draftProfile.value = { ...profile.value }
    isEditing.value = true
  }

  function cancelEdit() {
    if (!isProfileComplete.value) return false
    draftProfile.value = { ...profile.value }
    isEditing.value = false
    return true
  }

  async function saveProfile(logoFile = null) {
    isSaving.value = true
    error.value = null
    try {
      const payload = { ...draftProfile.value, logo: logoFile }
      const response = await companyProfileService.updateProfile(payload)
      applyProfileData(response.data)
      isEditing.value = false
      return true
    } catch (err) {
      error.value = err.message || 'Failed to save company profile.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  function reset() {
    profile.value = emptyProfile()
    draftProfile.value = emptyProfile()
    isEditing.value = false
    isLoading.value = false
    isSaving.value = false
    error.value = null
    hasFetchedProfile.value = false
  }

  return {
    profile,
    draftProfile,
    isEditing,
    isLoading,
    isSaving,
    error,
    hasFetchedProfile,
    isProfileComplete,
    fetchProfile,
    enableEditMode,
    cancelEdit,
    saveProfile,
    reset
  }
})

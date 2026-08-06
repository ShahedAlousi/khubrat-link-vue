import { ref } from 'vue'
import { defineStore } from 'pinia'
import companyProfileService from '@/services/companyProfileService'

export const useCompanyProfileStore = defineStore('companyProfile', () => {
  // النسخة المحفوظة فعلياً من السيرفر (وضع العرض يعتمد عليها)
  const profile = ref({
    id: null,
    name: '',
    logo_url: null,
    tagline: '',
    about: '',
    phone: '',
    email: ''
  })

  // نسخة مؤقتة تُربط بحقول الإدخال أثناء وضع التعديل، حتى لا نعدّل profile مباشرة قبل الحفظ
  const draftProfile = ref({ ...profile.value })

  const isEditing = ref(false) // وضع العرض أو التعديل
  const isLoading = ref(false) // أثناء جلب البيانات لأول مرة
  const isSaving = ref(false) // أثناء عملية الحفظ
  const error = ref(null)
  const hasFetchedProfile = ref(false) // لمعرفة هل تم تحميل البيانات من قبل (لتفادي إعادة الجلب كل فتح)

  // جلب بيانات بروفايل الشركة من السيرفر وتعبئتها في profile و draftProfile
  async function fetchProfile() {
    isLoading.value = true
    error.value = null
    try {
      const response = await companyProfileService.getProfile()
      profile.value = { ...response.data }
      draftProfile.value = { ...response.data }
      hasFetchedProfile.value = true
    } catch (err) {
      error.value = err
    } finally {
      isLoading.value = false
    }
  }

  // تفعيل وضع التعديل: ننسخ البيانات الحالية إلى draftProfile ليعدّل المستخدم عليها
  function enableEditMode() {
    draftProfile.value = { ...profile.value }
    isEditing.value = true
  }

  // إلغاء التعديل والرجوع لوضع العرض دون حفظ أي تغييرات
  function cancelEdit() {
    draftProfile.value = { ...profile.value }
    isEditing.value = false
  }

  // حفظ التعديلات: إرسال draftProfile للسيرفر، وعند النجاح تحديث profile والرجوع لوضع العرض
  // logoFile: تمرير كائن File إن اختار المستخدم شعار جديد، وإلا null
  async function saveProfile(logoFile = null) {
    isSaving.value = true
    error.value = null
    try {
      const payload = { ...draftProfile.value, logo: logoFile }
      const response = await companyProfileService.updateProfile(payload)
      profile.value = { ...response.data }
      draftProfile.value = { ...response.data }
      isEditing.value = false
      return true
    } catch (err) {
      error.value = err
      return false
    } finally {
      isSaving.value = false
    }
  }

  // إعادة تصفير الستور بالكامل (مفيد مثلاً عند تسجيل الخروج)
  function reset() {
    profile.value = {
      id: null,
      name: '',
      logo_url: null,
      tagline: '',
      about: '',
      phone: '',
      email: ''
    }
    draftProfile.value = { ...profile.value }
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
    fetchProfile,
    enableEditMode,
    cancelEdit,
    saveProfile,
    reset
  }
})
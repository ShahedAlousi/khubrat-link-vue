import api from './api'

const companyProfileService = {
  // جلب بيانات بروفايل الشركة الحالية (متاح لأي مستخدم مصادَق)
  async getProfile() {
    const response = await api.get('/company/profile')
    return response.data
  },

  // تحديث بيانات بروفايل الشركة (متاح فقط لـ General Manager)
  // payload: { name, phone, email, address, tagline, about, logo? }
  // logo: كائن File إذا المستخدم رفع شعار جديد، وإلا يُترك فارغاً
  async updateProfile(payload) {
    const hasNewLogo = payload.logo instanceof File

    if (hasNewLogo) {
      // مع رفع ملف لازم نرسل multipart/form-data
      // ولازم نستخدم method spoofing لأن Laravel لا يقرأ body الـ PUT مع multipart بشكل صحيح
      const formData = new FormData()
      formData.append('name', payload.name)
      formData.append('phone', payload.phone)
      formData.append('email', payload.email)
      formData.append('address', payload.address)
      formData.append('tagline', payload.tagline ?? '')
      formData.append('about', payload.about ?? '')
      formData.append('logo', payload.logo)
      formData.append('_method', 'PUT')

      const response = await api.post('/company/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    }

    // بدون شعار جديد نرسل JSON عادي بطلب PUT حقيقي
    const response = await axiosInstance.put('/company/profile', {
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      tagline: payload.tagline,
      about: payload.about
    })
    return response.data
  }
}

export default companyProfileService
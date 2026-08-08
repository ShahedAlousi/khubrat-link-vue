import api from './api'

const companyProfileService = {
  /** GET /api/company/profile */
  async getProfile() {
    const response = await api.get('/company/profile')
    return response.data
  },

  /**
   * PUT /api/company/profile (General Manager only)
   * Sends multipart when a new logo file is included; otherwise JSON.
   */
  async updateProfile(payload) {
    const hasNewLogo = payload.logo instanceof File

    if (hasNewLogo) {
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

    const response = await api.put('/company/profile', {
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      tagline: payload.tagline ?? '',
      about: payload.about ?? ''
    })
    return response.data
  }
}

export default companyProfileService

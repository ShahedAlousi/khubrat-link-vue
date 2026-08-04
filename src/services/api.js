import axios from 'axios'

const TOKEN_KEY = 'khubrat_token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,

  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    // ⭐ هذا الهيدر هو الذي يمنع ngrok من إرجاع صفحة التحذير
    'ngrok-skip-browser-warning': 'true'
  

  }
})

// Attach the bearer token (Laravel Sanctum) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalize error shape and handle expired/invalid sessions in one place.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const payload = error.response?.data

    if (status === 401) {
      tokenStorage.clear()
    }

    const normalized = {
      status,
      message: payload?.message || error.message || 'Something went wrong. Please try again.',
      errors: payload?.errors || null,
      raw: error
    }

    return Promise.reject(normalized)
  }
)

export default api

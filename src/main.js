import './assets/main.css'
import './utils/chart-setup'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { initLocale } from './i18n/runtime'
import { useAuthStore } from './stores/auth.store'

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(router)

// Rehydrate the session (token/user/company) from localStorage before the
// router's navigation guards run for the first time.
const authStore = useAuthStore()
authStore.restoreSession()
initLocale(authStore.user?.id)

app.mount('#app')


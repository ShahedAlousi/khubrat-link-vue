import './assets/main.css'
import './utils/chart-setup'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth.store'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Rehydrate the session (token/user/company) from localStorage before the
// router's navigation guards run for the first time.
useAuthStore().restoreSession()

app.mount('#app')

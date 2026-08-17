import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // يجب أن يطابق FRONTEND_URL / Stripe success_url في الباك اند (غالباً :3000)
    port: 3000,
    strictPort: true
  }
})

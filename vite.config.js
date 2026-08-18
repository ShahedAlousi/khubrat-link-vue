import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  let backendOrigin = 'http://localhost:8000'
  try {
    backendOrigin = new URL(env.VITE_API_BASE_URL || backendOrigin).origin
  } catch {
    // keep default
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      // يجب أن يطابق FRONTEND_URL / Stripe success_url في الباك اند (غالباً :3000)
      port: 3000,
      strictPort: true,
      proxy: {
        '/storage': {
          target: backendOrigin,
          changeOrigin: true,
          secure: true,
          headers: { 'ngrok-skip-browser-warning': 'true' }
        }
      }
    }
  }
})

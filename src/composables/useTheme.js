import { ref } from 'vue'

const STORAGE_KEY = 'khubrat_theme'

// Shared, module-level state so every component using this composable
// reflects the same theme without needing a full Pinia store.
const theme = ref(localStorage.getItem(STORAGE_KEY) || 'light')

function applyClass() {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
}

export function useTheme() {
  function initTheme() {
    applyClass()
  }

  function setTheme(next) {
    theme.value = next
    localStorage.setItem(STORAGE_KEY, next)
    applyClass()
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, initTheme, setTheme, toggleTheme }
}

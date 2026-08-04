/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Khubrat brand palette (lifted 1:1 from the supplied HTML design)
        khubrat: {
          blue: '#002173', // RGB(0, 33, 115)
          goldLight: '#FCD88A', // RGB(252, 216, 138)
          goldDark: '#835C21', // RGB(131, 92, 33)
          darkBg: '#0f172a',
          darkCard: '#1e293b'
        }
      },
      fontFamily: {
        sans: ['"Open Sans"', 'sans-serif']
      }
    }
  },
  plugins: []
}

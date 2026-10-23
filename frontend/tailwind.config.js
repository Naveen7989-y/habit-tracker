/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        dark: {
          bg: '#0f172a',
          surface: '#1e293b',
          card: '#1e293b',
          border: '#334155',
          muted: '#94a3b8'
        },
        fitness: {
          bg: '#080A12',
          bgSecondary: '#0D101B',
          card: '#111522',
          cardElevated: '#151A29',
          input: '#0B0E17',
          lime: '#C8FF00',
          limeHover: '#B4E600',
          violet: '#8B5CF6',
          violetDark: '#6D3CF5',
          cyan: '#25D9E6',
          success: '#39E58C',
          warning: '#FFBF47',
          error: '#FF5C67',
          text: '#F5F7FC',
          textSecondary: '#A4AABC',
          textMuted: '#70788D',
          border: '#242A3A',
          divider: '#1D2332',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}

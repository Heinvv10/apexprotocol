import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apex: {
          black: '#0a0a0a',
          dark: '#0f0f0f',
          gunmetal: '#1a1a2e',
          slate: '#16213e',
          accent: '#00d4ff',
          'accent-dim': '#00a8cc',
          text: '#f0f0f0',
          muted: '#8892b0',
          card: '#111118',
          'card-hover': '#161622',
          border: '#1e1e2e',
        },
        brand: {
          400: '#00d4ff',
          500: '#00bce0',
          600: '#00a8cc',
          700: '#008fad',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,212,255,0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(0,212,255,0.3)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-accent': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,212,255,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0,212,255,0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'pulse-accent': 'pulse-accent 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config

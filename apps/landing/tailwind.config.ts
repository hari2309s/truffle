import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        truffle: {
          bg: 'var(--t-bg)',
          surface: 'var(--t-surface)',
          card: 'var(--t-card)',
          border: 'var(--t-border)',
          muted: 'var(--t-muted)',
          text: 'var(--t-text)',
          'text-secondary': 'var(--t-text-secondary)',
          amber: 'var(--t-amber)',
          'amber-light': 'var(--t-amber-light)',
          green: 'var(--t-green)',
          red: 'var(--t-red)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(-0.4deg)' },
          '50%': { transform: 'translateY(-12px) rotate(0.4deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.06' },
          '50%': { opacity: '0.14' },
        },
      },
    },
  },
  plugins: [],
}

export default config

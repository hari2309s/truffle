import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        truffle: {
          bg: '#0e0d0c',
          surface: '#1e1d1b',
          card: '#2c2b28',
          border: '#404038',
          muted: '#706a5e',
          text: '#f5ead2',
          'text-secondary': '#c4a87e',
          amber: '#e8a84e',
          'amber-light': '#f0c070',
          green: '#4a7a5a',
          red: '#7a4a4a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft': 'bounce 1.5s infinite',
      },
    },
  },
  plugins: [],
}

export default config

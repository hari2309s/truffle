import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        truffle: {
          bg: 'var(--t-bg)',
          surface: 'var(--t-surface)',
          card: 'var(--t-card)',
          border: 'var(--t-border)',
          text: 'var(--t-text)',
          text2: 'var(--t-text2)',
          accent: 'var(--t-accent)',
          'accent-ink': 'var(--t-accent-ink)',
          'accent-soft': 'var(--t-accent-soft)',
          'accent-edge': 'var(--t-accent-edge)',
          'on-accent': 'var(--t-on-accent)',
          positive: 'var(--t-positive)',
          warning: 'var(--t-warning)',
          negative: 'var(--t-negative)',
          'plain-hover': 'var(--t-plain-hover)',
          h0: 'var(--t-h0)',
          h1: 'var(--t-h1)',
          h2: 'var(--t-h2)',
          h3: 'var(--t-h3)',
          h4: 'var(--t-h4)',
        },
      },
      fontFamily: {
        // Space Mono carries figures, labels and keys; Space Grotesk carries
        // headlines and body copy — same pairing as the app.
        sans: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        grotesk: ['var(--font-grotesk)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config

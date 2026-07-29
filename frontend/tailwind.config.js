/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        border: 'var(--color-border)',
        'border-hover': 'var(--color-border-hover)',
        accent: 'var(--color-accent)',
        'accent-dim': 'var(--color-accent-dim)',
        'accent-glow': 'var(--color-accent-glow)',
        ink: 'var(--color-ink)',
        'ink-muted': 'var(--color-ink-muted)',
        'ink-faint': 'var(--color-ink-faint)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        'node-bg': 'var(--color-node-bg)',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        title: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        node: '0 2px 8px 0 rgba(0,0,0,0.35), 0 0 0 0 transparent',
        'node-selected': '0 0 0 2px var(--color-accent), 0 4px 16px 0 rgba(0,0,0,0.4)',
        panel: '2px 0 12px 0 rgba(0,0,0,0.2)',
      },
      borderRadius: { DEFAULT: '8px' },
    },
  },
  plugins: [],
};

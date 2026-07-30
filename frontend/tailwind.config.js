/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#14171C',
        surface: '#1B2028',
        'surface-2': '#232B36',
        border: '#283242',
        'border-hover': '#39475E',
        'grid-hairline': '#223047',
        accent: '#E8823C',
        teal: '#5FC9BA',
        'accent-dim': '#C66C2A',
        'accent-glow': 'rgba(232, 130, 60, 0.18)',
        ink: '#EDEFF2',
        'ink-muted': '#7C8698',
        'ink-faint': '#454F60',
        success: '#5FC9BA',
        warning: '#E8823C',
        danger: '#E55353',
        'node-bg': '#1B2028',
      },
      fontFamily: {
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
        title: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        node: '0 2px 8px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
        'node-selected': '0 0 0 1.5px #E8823C, 0 4px 16px rgba(0, 0, 0, 0.5)',
        panel: '2px 0 12px 0 rgba(0,0,0,0.3)',
        hardware: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 3px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '6px',
      },
    },
  },
  plugins: [],
};

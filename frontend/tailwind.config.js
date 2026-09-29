/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Violet-dominant palette; `white`/slate shades are variable-driven
        // so the whole UI flips between dark and light themes.
        white: 'rgb(var(--c-white) / <alpha-value>)',
        slate: {
          50: 'rgb(var(--c-slate-50) / <alpha-value>)',
          100: 'rgb(var(--c-slate-100) / <alpha-value>)',
          200: 'rgb(var(--c-slate-200) / <alpha-value>)',
          300: 'rgb(var(--c-slate-300) / <alpha-value>)',
          400: 'rgb(var(--c-slate-400) / <alpha-value>)',
          500: 'rgb(var(--c-slate-500) / <alpha-value>)',
          600: 'rgb(var(--c-slate-600) / <alpha-value>)',
        },
        brand: {
          50: '#f5f3ff', 100: '#ede9fe',
          200: 'rgb(var(--c-brand-200) / <alpha-value>)',
          300: 'rgb(var(--c-brand-300) / <alpha-value>)',
          400: 'rgb(var(--c-brand-400) / <alpha-value>)',
          500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
          800: '#5b21b6', 900: '#4c1d95',
        },
        night: {
          800: '#1d1833', 900: '#100c1f',
          950: 'rgb(var(--c-night-950) / <alpha-value>)',
          975: 'rgb(var(--c-night-975) / <alpha-value>)',
        },
        // Text that must stay readable on top of gradient/glow surfaces
        onaccent: 'rgb(var(--onaccent) / <alpha-value>)',
      },
      boxShadow: {
        glow: '0 0 28px -6px rgba(139, 92, 246, 0.55)',
        'glow-sm': '0 0 18px -5px rgba(139, 92, 246, 0.45)',
        card: '0 8px 32px -12px rgba(10, 6, 26, 0.55)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out both',
        'slide-in-left': 'slide-in-left 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};

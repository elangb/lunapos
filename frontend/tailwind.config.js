/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4ff', 100: '#dbe7fe', 200: '#bfd4fe', 300: '#93b8fd',
          400: '#6093fa', 500: '#3b6df6', 600: '#2547eb', 700: '#1d37d8',
          800: '#1e2fae', 900: '#1e2c89',
        },
        secondary: { 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        ink: {
          50: '#f6f8fb', 100: '#eef1f6', 200: '#dfe5ee', 300: '#c6d0e0',
          400: '#92a0b8', 500: '#6b7a94', 600: '#4b5a72', 700: '#39465c',
          800: '#222c3d', 850: '#1b2433', 900: '#131a26', 950: '#0c111c',
        },
      },
      borderRadius: { '3xl': '1.5rem' },
      boxShadow: {
        soft: '0 1px 2px rgb(16 24 40 / 0.04), 0 1px 3px rgb(16 24 40 / 0.06)',
        medium: '0 4px 12px -2px rgb(16 24 40 / 0.08), 0 2px 4px -2px rgb(16 24 40 / 0.06)',
        strong: '0 24px 48px -12px rgb(16 24 40 / 0.18)',
        glow: '0 0 0 4px rgb(37 71 235 / 0.12)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'slide-in-right': { '0%': { opacity: '0', transform: 'translateX(16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

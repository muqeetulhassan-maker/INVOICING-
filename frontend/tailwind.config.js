import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#FAF9F6', // Canvas
          secondary: '#F4F1EA', // Muted surface / input fills
          tertiary: '#EBE6DC',
        },
        surface: {
          DEFAULT: '#FFFFFF', // Flat white surface
          secondary: '#F4F1EA', // Muted Surface
          subtle: '#FAF8F3',
          border: '#E5E0D8',  // Subtle 1px border
          hover: '#F8F7F4',
        },
        "surface-soft": '#F4F1EA',
        border: '#E5E0D8',
        ink: '#18181B',
        primary: {
          DEFAULT: '#18181B', // Primary Text
          soft: '#27272A',
        },
        secondary: {
          DEFAULT: '#686661', // Secondary / Muted Text
        },
        muted: {
          DEFAULT: '#686661',
          light: '#8E8C85',
        },
        accent: {
          DEFAULT: '#20483F', // Brand Primary
          hover: '#183730',
          dark: '#122924',
          light: '#E4EDE8',   // Brand Light
          subtle: '#F1F6F3',
        },
        "accent-light": '#E4EDE8',
        status: {
          success: '#2D6A4F',
          'success-bg': '#E8F3EE',
          warning: '#9A6B24',
          'warning-bg': '#FAF3E7',
          danger: '#B84A4A',
          'danger-bg': '#F9EBEB',
          info: '#2C5E7A',
          'info-bg': '#EEF5FA',
        },
      },
      fontFamily: {
        sans: ['"Geist"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Geist"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '0.75rem', // 12px
        card: '12px',
        subtle: '8px',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.04)',
        lift: '0 4px 12px rgba(24, 24, 27, 0.06), 0 1px 3px rgba(24, 24, 27, 0.04)',
        elevated: '0 4px 16px -2px rgba(24, 24, 27, 0.05), 0 1px 4px -1px rgba(24, 24, 27, 0.03)',
        modal: '0 20px 40px -8px rgba(24, 24, 27, 0.12), 0 0 0 1px rgba(229, 224, 216, 0.8)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
  plugins: [tailwindcssAnimate],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Custom Warm Golden Cream & High-Contrast Bistre Palette
        palette: {
          canvas: '#FAEED9',
          'canvas-soft': '#F5E8CF',
          surface: '#FFFDF8',
          'surface-soft': '#F7EAD2',
          accent: '#E1A837',
          'accent-hover': '#C99126',
          secondary: '#8D7A02',
          ink: '#38370D',
          'ink-secondary': '#4E4B11',
          'ink-muted': '#6B6615',
          border: '#E6D3B1',
          'border-strong': '#D8C29A'
        },
        // Executive Golden Cream System (Light Mode)
        academic: {
          bg: '#FAEED9',
          primary: '#38370D',
          accent: '#E1A837',
          'accent-light': '#FFF9EE',
          'accent-secondary': '#8D7A02',
          surface: '#FFFDF8',
          'surface-soft': '#F5E8CF',
          border: '#E6D3B1',
          'text-primary': '#38370D',
          'text-secondary': '#4E4B11',
          'text-muted': '#6B6615',
          success: '#16A34A',
          warning: '#E1A837',
          error: '#DC2626',
        },
        brand: {
          400: '#E1A837',
          500: '#BF871B',
          600: '#8D7A02',
          900: '#38370D'
        },
        // Dark Mode System: Background #1A1B26, Foreground #C0CAF5, Accent #7AA2F7
        dark: {
          bg: '#1A1B26',
          surface: '#24283B',
          elevated: '#292E42',
          border: '#292E42',
          'text-primary': '#C0CAF5',
          'text-secondary': '#A9B1D6',
          'text-muted': '#787C99',
          accent: '#7AA2F7',
          'accent-soft': '#3D59A1'
        }
      },
      fontSize: {
        'heading-xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.025em', fontWeight: '800' }],
        'heading-lg': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '700' }],
        'heading-md': ['1.1rem', { lineHeight: '1.35', letterSpacing: '-0.015em', fontWeight: '700' }],
        'body-lg': ['0.9375rem', { lineHeight: '1.65', letterSpacing: '0.01em' }],
        'body': ['0.8125rem', { lineHeight: '1.6', letterSpacing: '0.01em' }],
        'caption': ['0.6875rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],
      },
      letterSpacing: {
        'tight-heading': '-0.025em',
        'snug-heading': '-0.015em',
        'relaxed-body': '0.01em',
        'wide-label': '0.04em',
      },
      fontFamily: {
        sans: ['"Inter"', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        serif: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        lexend: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace']
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        '2xs': '0 1px 1px 0 rgba(15, 23, 42, 0.02)',
        'subtle-depth': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.03), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
        'elevated-card': '0 1px 3px 0 rgba(15, 23, 42, 0.03), 0 8px 24px -4px rgba(15, 23, 42, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
        'olive-glow': '0 0 20px -3px rgba(37, 99, 235, 0.25)',
        'accent-glow': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
        'card-hover': '0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 2px 6px 0 rgba(15, 23, 42, 0.03)',
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px'
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'scale-up': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-up': 'scale-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'spin-slow': 'spin-slow 12s linear infinite',
      },
    },
  },
  plugins: [],
}

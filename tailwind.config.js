/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Executive Pure White System (Light Mode)
        academic: {
          bg: '#F8FAFC',
          primary: '#0F172A',
          accent: '#2563EB',
          'accent-light': '#EFF6FF',
          'accent-secondary': '#3B82F6',
          surface: '#FFFFFF',
          'surface-soft': '#F1F5F9',
          border: '#E2E8F0',
          'text-primary': '#0F172A',
          'text-secondary': '#475569',
          'text-muted': '#64748B',
          success: '#16A34A',
          warning: '#D97706',
          error: '#DC2626',
        },
        brand: {
          400: '#3B82F6',
          500: '#2563EB',
          600: '#1D4ED8',
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
        'subtle-depth': '0 2px 8px -2px rgba(17, 18, 15, 0.05), 0 8px 16px -4px rgba(17, 18, 15, 0.04)',
        'elevated-card': '0 4px 20px -2px rgba(17, 18, 15, 0.08), 0 1px 3px 0 rgba(17, 18, 15, 0.04)',
        'olive-glow': '0 0 20px -3px rgba(89, 107, 53, 0.35)',
        'accent-glow': '0 0 20px -3px rgba(122, 162, 247, 0.35)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
        'card-hover': '0 8px 30px -4px rgba(17, 18, 15, 0.12), 0 2px 6px 0 rgba(17, 18, 15, 0.06)',
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
      },
      animation: {
        'slide-up': 'slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}

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
        // Academic Olive & Moss System (Light Mode)
        academic: {
          bg: '#F7F6F0',
          primary: '#11120F',
          accent: '#596B35',
          'accent-light': '#DCE8B7',
          'accent-secondary': '#8FA35F',
          surface: '#FFFFFF',
          'surface-soft': '#EEEEE8',
          border: '#D8D8CF',
          'text-primary': '#191A17',
          'text-secondary': '#65675F',
          'text-muted': '#85877E',
          success: '#4F7A45',
          warning: '#C49A3A',
          error: '#B94A48',
        },
        // Dark Mode System: Background #1A1B26, Foreground #A9B1D6, Accent #7AA2F7
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
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace']
      },
      boxShadow: {
        'subtle-depth': '0 2px 8px -2px rgba(17, 18, 15, 0.05), 0 8px 16px -4px rgba(17, 18, 15, 0.04)',
        'elevated-card': '0 4px 20px -2px rgba(17, 18, 15, 0.08), 0 1px 3px 0 rgba(17, 18, 15, 0.04)',
        'olive-glow': '0 0 20px -3px rgba(89, 107, 53, 0.35)',
        'accent-glow': '0 0 20px -3px rgba(122, 162, 247, 0.35)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px'
      }
    },
  },
  plugins: [],
}

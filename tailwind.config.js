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
        // Academic Olive & Moss System
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
        // Dark Mode System (Obsidian & Violet Edition)
        dark: {
          bg: '#0B0B0D',
          surface: '#18181D',
          elevated: '#23232A',
          border: '#272730',
          'text-primary': '#F5F5F7',
          'text-secondary': '#A1A1AA',
          accent: '#8B5CF6',
          'accent-soft': '#3B2473'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace']
      },
      boxShadow: {
        'subtle-depth': '0 2px 8px -2px rgba(17, 18, 15, 0.05), 0 8px 16px -4px rgba(17, 18, 15, 0.04)',
        'elevated-card': '0 4px 20px -2px rgba(17, 18, 15, 0.08), 0 1px 3px 0 rgba(17, 18, 15, 0.04)',
        'olive-glow': '0 0 20px -3px rgba(89, 107, 53, 0.35)',
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

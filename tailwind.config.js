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
        // Metallic Royal Gold (#D4AF37)
        brand: {
          50: '#FDFBF7',
          100: '#F5E6C8',
          200: '#EBD3A0',
          300: '#DFC077',
          400: '#D8B750',
          500: '#D4AF37', // User's Royal Gold
          600: '#B89327',
          700: '#93731B',
          800: '#6F5413',
          900: '#4B370B',
          950: '#2E2105',
        },
        // Warm Champagne Cream (#F5E6C8)
        champagne: {
          50: '#FCF9F2',
          100: '#F5E6C8', // User's Soft Cream
          200: '#EBD4A8',
          300: '#DFC188',
          400: '#D3AE68',
          500: '#C79B48',
          900: '#3D2D0F'
        },
        // Slate Neutral Gray (#6B7280)
        slate: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280', // User's Slate Gray
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#0B0F19'
        },
        // Deep Obsidian Black (#171717)
        obsidian: {
          50: '#333333',
          100: '#2B2B2B',
          200: '#242424',
          300: '#1F1F1F',
          400: '#1A1A1A',
          500: '#171717', // User's Deep Charcoal
          600: '#141414',
          700: '#101010',
          800: '#0D0D0D',
          900: '#0A0A0A',
          950: '#050505'
        },
        dark: {
          bg: '#171717',
          surface: '#1F1F1F',
          card: '#242424',
          border: '#333333',
          subtle: '#6B7280'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(212, 175, 55, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
        '3d': '0 10px 25px -5px rgba(212, 175, 55, 0.25), 0 8px 10px -6px rgba(212, 175, 55, 0.2)',
        'gold-glow': '0 0 25px -5px rgba(212, 175, 55, 0.35)',
        'card-3d': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}

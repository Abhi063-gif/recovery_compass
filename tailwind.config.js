/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Flat aliases for direct utility usage
        'brand-red': '#C8103E',
        'brand-red-hover': '#A80D34',
        'brand-navy': '#17243A',
        'brand-navy-secondary': '#25364F',
        'surface-bg': '#F5F7FA',
        'surface-card': '#FFFFFF',
        'surface-border': '#E2E8F0',

        // RecoveryCompass Primary Palette
        brand: {
          red: '#C8103E',
          'red-hover': '#A80D34',
          'red-light': '#FDF2F4',
          navy: '#17243A',
          'navy-secondary': '#25364F',
          'navy-light': '#324866',
        },
        primary: {
          50: '#FDF2F4',
          100: '#FBE4E9',
          200: '#F6CBD4',
          300: '#EE9BAF',
          400: '#E46383',
          500: '#D5355D',
          600: '#C8103E', // Authoritative Primary Red
          700: '#A80D34',
          800: '#8C0E2D',
          900: '#75102A',
        },
        surface: {
          bg: '#F5F7FA',
          card: '#FFFFFF',
          border: '#E2E8F0',
          subtle: '#F8FAFC',
          disabled: '#F1F5F9',
        },
        navy: {
          50: '#F4F6F9',
          100: '#E6EAF0',
          200: '#C7D1DF',
          300: '#9DB0C7',
          400: '#6E8BAC',
          500: '#4A6C91',
          600: '#365373',
          700: '#25364F',
          800: '#1B273A',
          900: '#17243A',
        },
        clinical: {
          red: '#DC2626',
          'red-bg': '#FEF2F2',
          amber: '#D97706',
          'amber-bg': '#FFFBEB',
          green: '#059669',
          'green-bg': '#ECFDF5',
          blue: '#2563EB',
          'blue-bg': '#EFF6FF',
        },
        content: {
          primary: '#17243A',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        // Legacy compatibility mappings
        medical: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        urgentRed: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        amberRisk: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        sage: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'button': '10px',
        'input': '10px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(23, 36, 58, 0.04), 0 1px 2px 0 rgba(23, 36, 58, 0.02)',
        'card': '0 4px 12px -2px rgba(23, 36, 58, 0.05), 0 2px 6px -1px rgba(23, 36, 58, 0.02)',
        'card-hover': '0 10px 20px -3px rgba(23, 36, 58, 0.08), 0 4px 8px -2px rgba(23, 36, 58, 0.03)',
        'elevated': '0 12px 24px -4px rgba(23, 36, 58, 0.08), 0 4px 8px -2px rgba(23, 36, 58, 0.03)',
      }
    },
  },
  plugins: [],
}

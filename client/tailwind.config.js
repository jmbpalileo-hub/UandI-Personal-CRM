/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#00B09B',
          dark: '#008C7E',
          light: '#E6F7F5',
          xlight: '#F0FBF9',
        },
        text: {
          primary: '#1A2E2B',
          secondary: '#4B6B67',
          muted: '#8FA8A5',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F7FAFA',
        },
        border: '#D1E8E5',
        status: {
          active: '#00B09B',
          warning: '#F59E0B',
          danger: '#EF4444',
          hold: '#94A3B8',
          complete: '#64748B',
        },
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        caveat: ['Caveat', 'cursive'],
      },
      borderRadius: {
        card: '12px',
        modal: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,176,155,0.08), 0 1px 2px rgba(0,176,155,0.04)',
        'card-hover': '0 4px 12px rgba(0,176,155,0.15)',
        input: '0 0 0 3px rgba(0,176,155,0.15)',
      },
    },
  },
  plugins: [],
}

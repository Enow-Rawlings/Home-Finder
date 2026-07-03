/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette derived from the Home Finder logo (navy + black)
        primary: {
          50: '#EEF1FA',
          100: '#D6DEF2',
          200: '#AEBDE5',
          300: '#7E94D2',
          400: '#4D69B8',
          500: '#2A479D',
          600: '#1E3A8A', // core brand navy (from logo)
          700: '#172C68',
          800: '#11204D',
          900: '#0B1635',
        },
        ink: {
          900: '#0F1115',
          800: '#1A1D23',
          700: '#2B2F38',
          500: '#5B6271',
          300: '#9AA1AD',
        },
        surface: {
          50: '#FAFBFD',
          100: '#F3F5F9',
          200: '#E7EAF1',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(15, 23, 42, 0.06)',
        cardHover: '0 12px 24px rgba(15, 23, 42, 0.10)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}

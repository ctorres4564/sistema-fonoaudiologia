/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        plum: {
          50: '#f7f3f9',
          100: '#ede3f1',
          200: '#dac6e2',
          300: '#c3a3cf',
          400: '#a97eb9',
          500: '#8d619f',
          600: '#6B4C7A',
          700: '#5a3f67',
          800: '#4a3454',
          900: '#35243c',
        },
        gold: {
          100: '#f8efcb',
          200: '#f0df9f',
          300: '#e6cb71',
          400: '#D4AF37',
          500: '#b7952f',
          600: '#8b6f23',
        },
        noble: {
          50: '#f4f4f5',
          100: '#e5e5e7',
          200: '#cdced2',
          300: '#a8aab1',
          400: '#7d808a',
          500: '#5f626c',
          600: '#4a4c54',
          700: '#3a3c43',
          800: '#2C2C2C',
          900: '#1d1e22',
        },
      },
      boxShadow: {
        card: '0 10px 25px -12px rgba(44,44,44,0.35)',
      },
    },
  },
  plugins: [],
}

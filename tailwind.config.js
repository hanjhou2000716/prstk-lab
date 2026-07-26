/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'Noto Sans TC', 'sans-serif'] },
      colors: {
        muji: {
          bg: '#FAF8F5', text: '#3C3935', muted: '#625D56', border: '#E3DDD5',
          accent: '#8E7F72', hover: '#F5EFE6', brand: '#4A606D',
          brandLight: '#EEF2F4', section: '#8B979F',
        },
        sage: '#91A69A',
        orange: '#D97745',
      },
    },
  },
  plugins: [],
};

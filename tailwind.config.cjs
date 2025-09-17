/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './houses.html',
    './book.html',
    './admin.html',
    './privacy.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        sand: '#F4E4C1',
        terracotta: '#C26A4A',
        sea: '#2A7F9E',
        dusk: '#1E3A4C',
        olive: '#3A5A40'
      },
      fontFamily: {
        sans: ['"Work Sans"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'serif']
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

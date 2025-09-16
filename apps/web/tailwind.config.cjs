/** @type {import('tailwindcss').Config} */
const path = require('node:path');

module.exports = {
  content: [
    path.resolve(__dirname, 'index.html'),
    path.resolve(__dirname, 'src/**/*.{ts,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1f6feb',
          secondary: '#0b3d91',
        },
      },
    },
  },
  plugins: [],
};

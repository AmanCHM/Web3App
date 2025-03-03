/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          500: '#3b82f6',
          900: '#1a365d',
        },
      },
    },
  },
  plugins: [],
};
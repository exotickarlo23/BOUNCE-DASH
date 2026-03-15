/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F5A623',
          'orange-light': '#FFF3E0',
          teal: '#1DBAB4',
          'teal-light': '#E0F7F6',
          bg: '#EFF7FA',
          dark: '#1A1A2E',
        }
      }
    },
  },
  plugins: [],
}

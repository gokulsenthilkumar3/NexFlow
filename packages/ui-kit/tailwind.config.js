/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "../../packages/ui-kit/src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
        },
      }
    },
  },
  plugins: [],
}

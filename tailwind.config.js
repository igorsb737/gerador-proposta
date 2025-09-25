/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/*.js",
    "./api/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        'saira': ['Saira', 'sans-serif'],
      },
      colors: {
        'dgenny-blue': '#07325b',
        'dgenny-bg': '#f6f6e9',
      }
    },
  },
  plugins: [],
}

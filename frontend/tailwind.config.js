/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",   // 👈 THIS LINE FIXES EVERYTHING
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

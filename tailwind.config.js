/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        muted: '#1a1a1a',
        accent: '#333333',
        border: '#222222',
      },
    },
  },
  plugins: [],
}

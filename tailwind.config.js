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
        muted: {
          DEFAULT: '#1a1a1a',
          foreground: '#a0a0a0',
        },
        accent: '#333333',
        'app-border': '#222222',
      },
    },
  },
  plugins: [],
}

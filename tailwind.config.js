/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Brand Colors ─────────────────────────────────── */
        "primary":           "#620046",   /* Main accent — deep magenta */
        "primary-hover":     "#772e64",   /* Lighter hover state */
        "primary-border":    "#831363",   /* Border/outline accent */
        "primary-border-hover": "#c53ead", /* Border hover state */
        "primary-glow":      "rgba(98, 0, 70, 0.4)", /* Box-shadow glow */

        /* ── Surface Colors ───────────────────────────────── */
        "surface":           "#09090b",   /* App background */
        "surface-raised":    "#0E0E10",   /* Sidebar, elevated panels */
        "surface-card":      "#18181A",   /* Cards, chat bubbles, inputs */
        "surface-hover":     "#1f1f23",   /* Hover state on surfaces */

        /* ── Text Colors ──────────────────────────────────── */
        "on-surface":        "#ffffff",
        "on-surface-muted":  "rgba(255, 255, 255, 0.6)",
        "on-surface-faint":  "rgba(255, 255, 255, 0.4)",
        "on-surface-ghost":  "rgba(255, 255, 255, 0.15)",

        /* ── Border Colors ────────────────────────────────── */
        "border-default":    "rgba(255, 255, 255, 0.05)",
        "border-subtle":     "rgba(255, 255, 255, 0.08)",
        "border-hover":      "rgba(255, 255, 255, 0.12)",

        /* ── Feedback ─────────────────────────────────────── */
        "error":             "#ffb4ab",
        "error-container":   "#93000a",
      },
      fontFamily: {
        "sans":     ["Space Grotesk", "sans-serif"],
        "headline": ["Space Grotesk", "sans-serif"],
        "body":     ["Space Grotesk", "sans-serif"],
        "space":    ["Space Grotesk", "sans-serif"],
      },
      borderRadius: {
        /* Keep Tailwind defaults, just add custom ones */
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}

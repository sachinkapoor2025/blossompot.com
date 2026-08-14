/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#c23a6b",
        nav: "#e07a9a",
        accent: "#2f8f6b",
        gold: "#e5a23a",
        petal: "#fff5f8",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Source Sans 3", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Cormorant Garamond", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

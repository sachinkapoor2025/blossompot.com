/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7a1f3d",
        nav: "#b76e79",
        accent: "#5b7c6a",
        gold: "#d97706",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Source Sans 3", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Cormorant Garamond", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

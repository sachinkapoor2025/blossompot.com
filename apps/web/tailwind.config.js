/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          deep: "rgb(var(--primary-deep) / <alpha-value>)",
        },
        nav: "rgb(var(--nav) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        promo: "rgb(var(--promo) / <alpha-value>)",
        sale: "rgb(var(--sale) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
        petal: "rgb(var(--petal) / <alpha-value>)",
        ink: "rgb(var(--foreground) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        ivory: "rgb(var(--background) / <alpha-value>)",
        line: "rgb(var(--border) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Source Sans 3", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Cormorant Garamond", "ui-serif", "Georgia", "serif"],
      },
      fontSize: {
        "store-nav": ["0.9375rem", { lineHeight: "1.375" }],
        "store-body": ["1rem", { lineHeight: "1.55" }],
        "store-title": ["1.125rem", { lineHeight: "1.4" }],
        "store-price": ["1.375rem", { lineHeight: "1.25" }],
        "store-section": ["2.125rem", { lineHeight: "1.2" }],
        "store-hero": ["3.25rem", { lineHeight: "1.1" }],
      },
      maxWidth: {
        store: "90rem",
      },
    },
  },
  plugins: [],
};

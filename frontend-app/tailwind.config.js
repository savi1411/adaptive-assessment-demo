// tailwind.config.js
const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Nunito Sans'", ...fontFamily.sans],
      },
      colors: {
        primary: "#22C55E",
      },
      borderRadius: {
        pill: "9999px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    // mantenha se seus componentes usam classes de animação do shadcn:
    require("tailwindcss-animate"),
  ],
};
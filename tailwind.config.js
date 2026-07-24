/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Gold identity matching the Nagami "Good Food | Good Mood" logo,
        // used across the whole app (admin dashboard, auth pages, QR menu).
        brand: {
          50: "#fefaf0",
          100: "#fdf3d9",
          200: "#f9e4ab",
          300: "#f3cd6e",
          400: "#e9b53e",
          500: "#d4a017",
          600: "#b0830f",
          700: "#8c670e",
          800: "#6f5310",
          900: "#5c4512",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

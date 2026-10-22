/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          300: "#fde047",
          400: "#facc15",
          500: "#f0b90b",
          600: "#ca8a04",
          700: "#b8860b",
          800: "#8c6708",
        },
        dark: {
          950: "#080a0d",
          900: "#0e1117",
          850: "#131820",
          800: "#181f2a",
          700: "#1f2837",
          600: "#273346",
        },
        obsidian: {
          950: "#080a0d",
          900: "#0e1117",
          850: "#131820",
          800: "#181f2a",
          700: "#1f2837",
          600: "#273346",
        },
      },
      fontFamily: {
        heading: ["Outfit", "sans-serif"],
        display: ["Outfit", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        body: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 24px rgba(240, 185, 11, 0.28)",
        "gold-lg": "0 0 40px rgba(240, 185, 11, 0.45)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #fef08a 0%, #f0b90b 50%, #b8860b 100%)",
        "gold-gradient-hover": "linear-gradient(135deg, #fff7ed 0%, #facc15 50%, #ca8a04 100%)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease-out forwards",
      },
    },
  },
  plugins: [],
};

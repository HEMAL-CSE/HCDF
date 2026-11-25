/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        hcdf: {
          50: "#eff8f4", 100: "#d9eee4", 200: "#b6dfcc",
          500: "#23845f", 600: "#176b4c", 700: "#12553e",
          800: "#123b32", 900: "#102f29"
        }
      },
      boxShadow: { soft: "0 12px 35px rgba(16, 47, 41, .07)" }
    }
  },
  plugins: []
};

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f9f2",
          100: "#e8f2e4",
          500: "#2c7a4b",
          600: "#1f6139",
          700: "#174a2c"
        },
        sand: "#f7f1e3",
        ink: "#111827",
        pitch: "#0f3d2e",
        danger: "#b42318"
      },
      boxShadow: {
        card: "0 10px 30px rgba(15, 61, 46, 0.12)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;


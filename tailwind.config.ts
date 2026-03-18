import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0F0F0F",
          secondary: "#151515",
        },
        text: {
          primary: "#F5F5F5",
          secondary: "#A0A0A0",
        },
        accent: {
          DEFAULT: "#C9A96E",
          hover: "#D4B98A",
        },
        border: "#222222",
      },
      fontFamily: {
        heading: [
          "Neue Montreal",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        body: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9f5",
          100: "#d6f0e6",
          200: "#aee0cf",
          300: "#79c9b1",
          400: "#46ab8f",
          500: "#229176",
          600: "#16745f",
          700: "#135d4d",
          800: "#134a3f",
          900: "#123e36",
        },
      },
    },
  },
  plugins: [],
};

export default config;

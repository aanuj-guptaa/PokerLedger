import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        poker: {
          bg: "#080c14",
          surface: "#0f1623",
          card: "#141d2d",
          border: "#1f2d44",
          borderLight: "#2e3f5c",
          hover: "#1a2538",
          felt: "#064e3b",
          emerald: "#10b981",
          gold: "#f59e0b",
          goldMuted: "#b45309",
          red: "#ef4444",
          blue: "#3b82f6",
        },
      },
      boxShadow: {
        glowEmerald: "0 0 25px -5px rgba(16, 185, 129, 0.3)",
        glowGold: "0 0 25px -5px rgba(245, 158, 11, 0.25)",
        glowRed: "0 0 25px -5px rgba(239, 68, 68, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;

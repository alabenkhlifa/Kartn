import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Accent - KarTN Blue
        accent: {
          DEFAULT: "#00D4FF",
          hover: "#1AD1FF",
          muted: "#00D4FF",
        },
        // Background - ChatGPT-like grays
        bg: {
          primary: "#212121",
          secondary: "#2f2f2f",
          elevated: "#303030",
        },
        // Text
        text: {
          primary: "#ececec",
          secondary: "#b4b4b4",
        },
        // Status
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

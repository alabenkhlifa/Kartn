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
        // Accent - Electric Blue
        accent: {
          DEFAULT: "#2D8CFF",
          hover: "#1A7AEE",
          light: "#2D8CFF20",
        },
        // Background - Dark gray theme
        bg: {
          primary: "#1E1E1E",
          secondary: "#2A2A2A",
          elevated: "#353535",
        },
        // Text
        text: {
          primary: "#FFFFFF",
          secondary: "#B0B0B0",
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

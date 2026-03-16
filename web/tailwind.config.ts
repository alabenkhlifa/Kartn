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
        // Background - Deep dark with blue tint
        bg: {
          primary: "#0F0F14",
          secondary: "#1A1A24",
          elevated: "#24243A",
          surface: "#1E1E30",
        },
        // Text
        text: {
          primary: "#F0F0F5",
          secondary: "#8E8EA0",
        },
        // Borders
        border: {
          subtle: "rgba(255, 255, 255, 0.06)",
          medium: "rgba(255, 255, 255, 0.12)",
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

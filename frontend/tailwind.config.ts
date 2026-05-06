import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   "#0a0a0f",
          secondary: "#12121a",
          card:      "#14141f",
          hover:     "#1e1e30",
        },
        accent: {
          purple:       "#7c3aed",
          purple_light: "#a78bfa",
          gold:         "#f59e0b",
          gold_light:   "#fcd34d",
          cyan:         "#06b6d4",
          green:        "#10b981",
          red:          "#ef4444",
        },
        stat: {
          vit: "#ef4444",
          foc: "#06b6d4",
          sab: "#a78bfa",
          dis: "#f59e0b",
          cre: "#10b981",
          vol: "#f97316",
        },
      },
      fontFamily: {
        mono:    ["'JetBrains Mono'", "monospace"],
        display: ["'Space Grotesk'", "sans-serif"],
      },
      keyframes: {
        "slide-in": {
          from: { opacity: "0", transform: "translateX(100%)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-5px)" },
        },
        "pulse-ring": {
          "0%":   { boxShadow: "0 0 0 0 rgba(124,58,237,0.4)" },
          "70%":  { boxShadow: "0 0 0 10px rgba(124,58,237,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(124,58,237,0)" },
        },
      },
      animation: {
        "slide-in":   "slide-in 0.3s cubic-bezier(0.34,1.2,0.64,1)",
        "fade-in":    "fade-in 0.25s ease-out",
        "shimmer":    "shimmer 2.5s ease-in-out infinite",
        "float":      "float 3s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

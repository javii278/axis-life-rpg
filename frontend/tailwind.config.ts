import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta oscura RPG
        bg: {
          primary: "#0a0a0f",
          secondary: "#12121a",
          card: "#1a1a26",
          hover: "#22223a",
        },
        accent: {
          purple: "#7c3aed",
          purple_light: "#a78bfa",
          gold: "#f59e0b",
          gold_light: "#fcd34d",
          cyan: "#06b6d4",
          green: "#10b981",
          red: "#ef4444",
        },
        stat: {
          vit: "#ef4444",   // Rojo — Vitalidad
          foc: "#06b6d4",   // Cyan — Foco
          sab: "#a78bfa",   // Violeta — Sabiduría
          dis: "#f59e0b",   // Dorado — Disciplina
          cre: "#10b981",   // Verde — Creatividad
          vol: "#f97316",   // Naranja — Voluntad
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        display: ["'Space Grotesk'", "sans-serif"],
      },
      keyframes: {
        "slide-in": {
          from: { opacity: "0", transform: "translateX(100%)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in":  "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

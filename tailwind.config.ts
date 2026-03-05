import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./result.html", "./popup.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#ff6a00",
        accentBright: "#ff8a00",
        neon: "#ff4df0",
        neonBlue: "#6c63ff",
        surface: "#0f0f15",
        border: "#2a2a35",
        text: "#f3f3f7",
        muted: "#8c8c9f",
        obsidian: "#07070c",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at 30% 30%, rgba(255,106,0,0.25), transparent 40%), radial-gradient(circle at 70% 70%, rgba(255,77,240,0.25), transparent 40%)",
        "grid-pattern":
          "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
    },
  },
  plugins: [],
};

export default config;

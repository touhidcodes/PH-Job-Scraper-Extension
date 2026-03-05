import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        results: resolve(__dirname, "results.html"),
        content: resolve(__dirname, "src/content/content.ts"),
        background: resolve(__dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "content" || chunkInfo.name === "background") {
            return "[name].js";
          }
          return "[name].js"; // optional: can keep as assets/[name]-[hash].js
        },
      },
    },
  },
});

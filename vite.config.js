import { resolve } from "path";
import { defineConfig } from "vite";
export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                popup: resolve(__dirname, "popup/index.html"),
                background: resolve(__dirname, "background.ts"),
            },
            output: {
                entryFileNames: "[name].js",
                chunkFileNames: "[name].js",
                assetFileNames: "[name].[ext]",
            },
        },
        outDir: "dist",
        emptyOutDir: true,
    },
});

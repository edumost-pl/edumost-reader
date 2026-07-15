import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** GitHub Pages project site: https://edumost-pl.github.io/edumost-reader/ */
const base = process.env.VITE_BASE ?? "/edumost-reader/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: "dist",
  },
});

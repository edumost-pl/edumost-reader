import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/** GitHub Pages project site: https://edumost-pl.github.io/edumost-reader/ */
const base = process.env.VITE_BASE ?? "/edumost-reader/";

/** SPA fallback for GitHub Pages (deep links → 404.html). */
function spaFallbackPlugin() {
  return {
    name: "edumost-spa-fallback",
    closeBundle() {
      const index = resolve("dist/index.html");
      const fallback = resolve("dist/404.html");
      if (existsSync(index)) {
        copyFileSync(index, fallback);
      }
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    react(),
    spaFallbackPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.svg"],
      manifest: {
        name: "EduMost Reader",
        short_name: "EduMost",
        description: "Читайте книги EduMost офлайн — из облачной библиотеки GitHub",
        theme_color: "#2d6a4f",
        background_color: "#f8f9fa",
        display: "standalone",
        orientation: "any",
        start_url: base,
        scope: base,
        lang: "ru",
        icons: [
          {
            src: "icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/edumost-pl\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "edumost-book-zips",
              networkTimeoutSeconds: 15,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    outDir: "dist",
  },
});

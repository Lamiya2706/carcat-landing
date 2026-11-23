import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Served from https://lamiya2706.github.io/carcat-landing/ — set BASE_PATH=/ for a custom domain.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? "/carcat-landing/",
  build: {
    rollupOptions: {
      // the SSR build (--ssr) brings its own entry, so only list pages for the client build
      input: process.argv.includes("--ssr") ? undefined : { main: resolve(__dirname, "index.html"), admin: resolve(__dirname, "admin/index.html") },
    },
  },
});

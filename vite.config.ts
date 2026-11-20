import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://lamiya2706.github.io/carcat-landing/ — set BASE_PATH=/ for a custom domain.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? "/carcat-landing/",
});

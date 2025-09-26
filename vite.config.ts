import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "/mac-woop/", // Remplacez 'mac-woop' par le nom de votre repository GitHub
});

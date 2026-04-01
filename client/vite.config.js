import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    origin: "https://extroverted-ruby.outray.app",
    hmr: {
      protocol: "https",
      host: "extroverted-ruby.outray.app",
      clientPort: 443,
    },
  },
});

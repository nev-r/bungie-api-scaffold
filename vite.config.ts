import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: { https: true },
  define: { BUNGIE_APP_INFO: { api_key: "", client_id: "", client_secret: "" } },
  base: "./",
});

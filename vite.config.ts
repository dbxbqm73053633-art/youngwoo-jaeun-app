import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = "youngwoo-jaeun-app";

export default defineConfig(({ command }) => ({
  base: command === "build" ? `/${repoName}/` : "/",
  plugins: [react()],
}));

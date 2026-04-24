import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const repoName = "youngwoo-jaeun-app";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const deployTarget = env.DEPLOY_TARGET || "";
  const base = deployTarget === "github-pages" ? `/${repoName}/` : "/";

  return {
    base,
    plugins: [react()],
  };
});

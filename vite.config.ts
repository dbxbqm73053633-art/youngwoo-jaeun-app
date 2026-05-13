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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
              return "react-vendor";
            }
            if (id.includes("node_modules/@firebase/firestore") || id.includes("node_modules/firebase/firestore")) {
              return "firebase-firestore";
            }
            if (id.includes("node_modules/@firebase/storage") || id.includes("node_modules/firebase/storage")) {
              return "firebase-storage";
            }
            if (id.includes("node_modules/@firebase/auth") || id.includes("node_modules/firebase/auth")) {
              return "firebase-auth";
            }
            if (id.includes("node_modules/@firebase") || id.includes("node_modules/firebase")) {
              return "firebase-core";
            }
          },
        },
      },
    },
  };
});

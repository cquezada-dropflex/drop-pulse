import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test/empty-module.ts", import.meta.url)),
    },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
    env: {
      APP_URL: "https://app.dropflex.test",
      OAUTH_STATE_SECRET: "x".repeat(40),
      SHOPIFY_API_KEY: "key",
      SHOPIFY_API_SECRET: "shopify-secret",
      SHOPIFY_API_VERSION: "2026-07",
      META_APP_ID: "123",
      META_APP_SECRET: "meta-secret",
      META_LOGIN_CONFIG_ID: "cfg",
      META_GRAPH_VERSION: "v24.0",
    },
  },
});

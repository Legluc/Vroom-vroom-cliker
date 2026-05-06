// @ts-check
import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3001",
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
    ignoreHTTPSErrors: true,
    video: "off",
  },
  webServer: {
    command: "node server.js",
    url: "http://localhost:3001",
    reuseExistingServer: false,
    env: {
      NODE_ENV: "test",
      PORT: "3001",
      DATABASE_URL: ":memory:",
      SESSION_SECRET: "e2e-test-secret",
    },
  },
});

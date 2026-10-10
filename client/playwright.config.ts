import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  timeout: 30_000,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:5175", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { browserName: "chromium", channel: "msedge", viewport: { width: 1365, height: 900 } } },
    { name: "mobile", use: { browserName: "chromium", channel: "msedge", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: [
    { command: "node ../server/tests/fixtures/saved-events-server.js", url: "http://127.0.0.1:3001/api/health", timeout: 120_000 },
    { command: "npm run dev -- --host 127.0.0.1 --port 5175 --strictPort", url: "http://127.0.0.1:5175", env: { VITE_API_URL: "http://127.0.0.1:3001/api" } },
  ],
});

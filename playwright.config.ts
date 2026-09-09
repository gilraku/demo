import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    channel: "chrome",
    launchOptions: { args: ["--no-sandbox", "--enable-unsafe-swiftshader"] },
    viewport: { width: 1440, height: 1100 },
    screenshot: "only-on-failure",
  },
  reporter: "list",
});

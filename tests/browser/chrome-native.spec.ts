import { test, expect } from "@playwright/test";
test.use({
  launchOptions: {
    args: ["--no-sandbox"],
    ignoreDefaultArgs: ["--enable-unsafe-swiftshader"],
  },
});
test("Chrome without forced software renderer reaches a usable graphics mode", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Jelajahi Pengelolaan air", exact: true }),
  ).toBeVisible({ timeout: 20000 });
  const mode = (await page.locator(".terrain-fallback").count())
    ? "2D fallback; WebGL context unavailable"
    : "3D renderer initialized";
  console.log(`CHROME_WITHOUT_FORCED_RENDERER: ${mode}`);
  await testInfo.attach("graphics-mode", {
    body: mode,
    contentType: "text/plain",
  });
  await page.screenshot({ path: "test-results/chrome-native.png" });
});

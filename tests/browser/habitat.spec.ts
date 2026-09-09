import { test, expect } from "@playwright/test";

test("landscape chapters retain relevant markers with reduced motion", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 960, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Jelajahi Pengelolaan air", exact: true }),
  ).toBeVisible({ timeout: 60000 });
  await page.screenshot({ path: "test-results/habitat-active.png" });
  await page
    .getByRole("button", { name: "01 Praoperasi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sebelum tanah dibuka." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Jelajahi Pengelolaan air", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Jelajahi Wilayah sekitar", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/habitat-pre.png" });
  await page
    .getByRole("button", { name: "03 Pascatambang", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Setelah penambangan." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Jelajahi Lahan reklamasi", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/habitat-post.png" });
  expect(errors).toEqual([]);
});

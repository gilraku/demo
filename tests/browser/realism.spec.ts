import { test, expect } from "@playwright/test";
test("operational scene supports stage changes and pausing activity", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByRole("button", { name: "Jelajahi Pengelolaan air", exact: true }),
  ).toBeVisible({ timeout: 90000 });
  await page.getByRole("button", { name: "Jeda animasi" }).click();
  await expect(
    page.getByRole("button", { name: "Lanjutkan animasi" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "01 Praoperasi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sebelum tanah dibuka." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lanjutkan animasi" }).click();
  await page.getByRole("button", { name: "02 Operasi", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Di dalam operasi." }),
  ).toBeVisible();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "test-results/operational-realism.png" });
  expect(errors).toEqual([]);
});

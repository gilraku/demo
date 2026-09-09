import { test, expect } from "@playwright/test";

test("local Kenney models load and chapters remain navigable", async ({
  page,
}) => {
  test.setTimeout(300000);
  await page.setViewportSize({ width: 960, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  const models = new Set<string>();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.url().includes("/assets/kenney/nature/") &&
      response.url().endsWith(".glb")
    ) {
      if (response.ok()) models.add(response.url());
      else errors.push(`Model HTTP ${response.status()}: ${response.url()}`);
    }
  });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 60000 });
  await expect.poll(() => models.size, { timeout: 90000 }).toBe(9);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-nature-models",
    "7",
    { timeout: 90000 },
  );
  await expect(
    page.getByRole("button", { name: "Jelajahi Pengelolaan air", exact: true }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-industrial-models",
    "4",
    { timeout: 90000 },
  );
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-operations-presence",
    "1.000",
  );
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-rehabilitation-presence",
    "0.000",
  );
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-site-detail-models",
    "4",
    { timeout: 90000 },
  );
  if (process.env.CAPTURE_SCENE === "1")
    await page.screenshot({ path: "test-results/kenney-active.png" });
  await page
    .getByRole("button", { name: "01 Praoperasi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sebelum tanah dibuka." }),
  ).toBeVisible({ timeout: 60000 });
  await expect(
    page.getByRole("button", { name: "Jelajahi Pengelolaan air", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "03 Pascatambang", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Setelah penambangan." }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-operations-presence",
    "0.000",
  );
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-rehabilitation-presence",
    "1.000",
  );
  // Exercise interrupted transitions with motion enabled, then settle on post.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(async () => {
    for (const label of ["02 Operasi", "01 Praoperasi", "03 Pascatambang"]) {
      const button = [
        ...document.querySelectorAll<HTMLButtonElement>(
          ".chapter-switcher button",
        ),
      ].find(
        (button) =>
          button.textContent?.replace(/\s+/g, "") === label.replace(/\s+/g, ""),
      );
      if (!button) throw new Error(`Missing chapter ${label}`);
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  });
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-operations-presence",
    "0.000",
    { timeout: 60000 },
  );
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-rehabilitation-presence",
    "1.000",
    { timeout: 60000 },
  );
  await page.getByRole("button", { name: "Jeda animasi" }).click();
  if (process.env.CAPTURE_SCENE === "1")
    await page.screenshot({ path: "test-results/kenney-post.png" });
  expect(errors).toEqual([]);
});

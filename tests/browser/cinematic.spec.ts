import { test, expect } from "@playwright/test";

test("full-screen landscape, location drawer, stages and regulation reader", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Di dalam operasi." }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => {
    (window as Window & { __initialCanvas?: HTMLCanvasElement }).__initialCanvas =
      document.querySelector("canvas") || undefined;
  });
  await expect(
    page.getByRole("button", { name: "Jelajahi Pengelolaan air", exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole("button", { name: "Lahan reklamasi", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".context-drawer")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/cinematic-desktop.png" });
  await page
    .getByRole("button", { name: "Jelajahi Pengelolaan air", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Air & pengendalian pencemaran" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tutup konteks" }).click();
  await expect(page.locator(".context-drawer")).toHaveCount(0);
  await page.getByRole("button", { name: /03.*Pascatambang/ }).click();
  await expect(
    page.getByRole("heading", { name: "Setelah penambangan." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Lahan reklamasi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Reklamasi & pascatambang" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/cinematic-drawer.png" });
  await page
    .getByRole("button", { name: "Telusuri regulasi terkait", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Baca peraturan" }).first(),
  ).toBeVisible({ timeout: 25000 });
  await page.getByRole("button", { name: "Baca peraturan" }).first().click();
  await expect(page.locator(".article").first()).toBeVisible({
    timeout: 25000,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Pustaka regulasi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pustaka regulasi." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __initialCanvas?: HTMLCanvasElement }).__initialCanvas ===
        document.querySelector("canvas"),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Jelajah", exact: true }).click();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20000 });
  expect(errors).toEqual([]);
});

test("mobile landscape and keyboard location open a usable bottom sheet", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Jelajahi Pengelolaan air", exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page.getByRole("button", { name: "Lahan reklamasi", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/cinematic-mobile.png" });
  await page
    .getByRole("button", { name: "03 Pascatambang", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Lahan reklamasi", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Lahan reklamasi", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Reklamasi & pascatambang" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/cinematic-mobile-drawer.png" });
  await page.getByRole("button", { name: "Tutup konteks" }).click();
  await expect(page.locator(".context-drawer")).toHaveCount(0);
});

test("WebGL failure provides interactive map and retry diagnostics", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      return String(args[0]).includes("webgl")
        ? null
        : original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(
    page.getByRole("img", { name: "Peta skematis lokasi tambang" }),
  ).toBeVisible();
  await page.getByText("Tampilan 3D belum berhasil dimulai").click();
  await expect(
    page.getByRole("button", { name: "Coba tampilan 3D lagi" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Jelajahi Area tambang", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Perencanaan & perizinan" }),
  ).toBeVisible();
});

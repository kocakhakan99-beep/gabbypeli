import { test, expect } from "@playwright/test";
test("leaving a completed room cancels automatic advance", async ({ page }) => {
  await page.goto("/");
  await page.locator("#gf-open-find").click();
  for (const spot of await page.locator(".hide-spot").all()) {
    if (await page.locator("#gf-action").isVisible()) break;
    await spot.click();
  }
  await expect(page.locator("#gf-action")).toBeVisible();
  await page.locator("#gf-home-button").click();
  await page.waitForTimeout(4000);
  await expect(page.locator("#gf-open-find")).toBeVisible();
  await expect(page.locator("#gf-home")).toBeVisible();
});

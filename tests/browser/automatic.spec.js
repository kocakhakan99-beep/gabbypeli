import { test, expect } from "@playwright/test";

test("leaving a completed room cancels automatic celebration", async ({ page }) => {
  await page.goto("/");
  await page.locator("#gf-open-find").click();
  await page.getByText("Piilopelin asetukset", { exact: true }).click();
  await page.getByRole("combobox", { name: "Huoneita", exact: true }).selectOption("1");
  await page.getByRole("button", { name: "Uusi piiloleikki" }).click();
  for (const spot of await page.locator(".hide-spot").all()) {
    await spot.press("Enter");
    if ((await page.locator("#gf-feedback").textContent()).includes("Löysit kaverin!")) break;
  }
  await expect(page.locator("#gf-feedback")).toContainText("Löysit kaverin!");
  await expect(page.locator("#gf-action")).toBeHidden();
  await page.locator("#gf-home-button").click();
  await page.waitForTimeout(1200);
  await expect(page.locator("#gf-win")).toBeHidden();
  await expect(page.locator("#gf-home")).toBeVisible();
});

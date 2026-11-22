import { test, expect } from "@playwright/test";

test("success advances automatically and leaving a room cancels the pending step", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#gf-sound").click();
  await page.locator("#gf-open-bubbles").click();
  for (const bubble of await page.locator("#gf-bubble-field button.blue").all())
    await bubble.click();
  await expect(page.locator("#gf-action")).toBeVisible();
  await expect(
    page.locator("#gf-bubble-field button.pink").first(),
  ).toBeVisible({ timeout: 7000 });
  for (const bubble of await page.locator("#gf-bubble-field button.pink").all())
    await bubble.click();
  await page.locator("#gf-home-button").click();
  await page.waitForTimeout(4000);
  await expect(page.locator("#gf-open-bubbles")).toBeVisible();
  await page.locator("#gf-open-baking").click();
  await expect(page.locator("#gf-baking")).toBeVisible();
});

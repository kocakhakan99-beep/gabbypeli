import { test, expect } from "@playwright/test";

test("the Phaser room opens furniture and cleans up on leaving", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator("#gf-open-find").click();
  const room = page.locator(".hide-room");
  await expect(room).toHaveClass(/phaser-ready/);
  await expect(room.locator("canvas")).toBeVisible();
  const firstSpot = room.locator(".hide-spot").first();
  await firstSpot.click();
  await expect(firstSpot).toHaveClass(/opened/);
  await page.locator("#gf-home-button").click();
  await expect(page.locator("#gf-home")).toBeVisible();
  await expect(room.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});

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

test("tapping and dragging both open furniture", async ({ page }) => {
  await page.goto("/");
  await page.locator("#gf-open-find").click();
  const room = page.locator(".hide-room");
  await expect(room).toHaveClass(/phaser-ready/);
  const spot = room.locator(".hide-spot").first();
  const bounds = await spot.boundingBox();
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 8, y, { steps: 2 });
  await page.mouse.up();
  await expect(spot).toHaveClass(/opened/);

  await page.locator("#gf-home-button").click();
  await page.locator("#gf-open-find").click();
  const nextSpot = page.locator(".hide-spot").first();
  await expect(page.locator(".hide-room")).toHaveClass(/phaser-ready/);
  const nextBounds = await nextSpot.boundingBox();
  await page.mouse.move(nextBounds.x + nextBounds.width / 2, nextBounds.y + nextBounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(nextBounds.x + nextBounds.width / 2 - Math.max(60, nextBounds.width * 0.3), nextBounds.y + nextBounds.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(nextSpot).toHaveClass(/opened/);
});

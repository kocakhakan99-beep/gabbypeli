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
  await firstSpot.press("Enter");
  await expect(firstSpot).toHaveClass(/opened/);
  await page.locator("#gf-home-button").click();
  await expect(page.locator("#gf-home")).toBeVisible();
  await expect(room.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("short movement leaves furniture closed and a deliberate drag opens it", async ({ page }) => {
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
  await expect(spot).not.toHaveClass(/opened/);

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

test("memory and puzzle graphics load and release their canvases", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const mode of ["memory", "puzzle"]) {
    await page.locator(`#gf-open-${mode}`).click();
    const panel = page.locator(`#gf-${mode}`);
    await expect(panel).toHaveClass(new RegExp(`phaser-${mode}-ready`));
    await expect(panel.locator("canvas")).toBeVisible();
    await page.locator("#gf-hint").click();
    await expect(panel).toHaveClass(new RegExp(`phaser-${mode}-ready`));
    if (mode === "memory") {
      await page.locator("#gf-cards button").first().press("Enter");
      const firstCard = page.locator("#gf-cards button").first();
      await firstCard.focus();
      await firstCard.press("Enter");
      await expect(firstCard).toBeFocused();
      await expect(firstCard).toHaveAttribute("aria-pressed", "true");
    }
    await page.locator("#gf-home-button").click();
    await expect(panel.locator("canvas")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

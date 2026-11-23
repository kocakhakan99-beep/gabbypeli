import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 320, height: 740 }, hasTouch: true, isMobile: true });

test("adventure map and celebration fit a small touch screen", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const rooms = page.locator(".dollhouse-rooms");
  await expect(rooms.locator(".game-link:visible")).toHaveCount(6);
  await expect(rooms.locator("button:visible")).toHaveCount(5);
  const images = page.locator(".home-house img, .dollhouse-rooms img");
  await expect(images).toHaveCount(7);
  await expect.poll(() => images.evaluateAll((elements) =>
    elements.every((image) => image.complete && image.naturalWidth > 0)
  )).toBe(true);
  await expect(rooms).toHaveCSS("grid-template-columns", /^\S+ \S+$/);
  await page.screenshot({ path: testInfo.outputPath("nukketalo-320.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath("nukketalo-390.png"), fullPage: true });
  await page.setViewportSize({ width: 1200, height: 900 });
  await expect(rooms).toHaveCSS("grid-template-columns", /^\S+ \S+ \S+$/);
  await page.screenshot({ path: testInfo.outputPath("nukketalo-1200.png"), fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  const navigation = page.getByRole("navigation", { name: "Nukketalo" });
  await navigation.getByRole("button", { name: "Tarrakirja" }).tap();
  await expect(page.locator("#gf-sticker-book")).toBeVisible();
  await expect(page.locator("#gf-free-games")).toBeHidden();
  await navigation.getByRole("button", { name: "Leikit" }).tap();
  await expect(page.locator("#gf-free-games")).toBeVisible();
  await expect(page.locator("#gf-sticker-book")).toBeHidden();
  await navigation.getByRole("button", { name: "Koti" }).tap();
  await expect(page.locator(".home-house img")).toBeVisible();
  await expect(page.locator("#gf-free-toggle")).toHaveText("Hiekkalaatikko");
  await expect(page.locator("#gf-campaign-toggle")).toContainText("Seikkailu");
  await page.locator("#gf-campaign-toggle").tap();
  for (const game of ["memory", "puzzle", "find", "garden", "baking"]) {
    await page.locator(`#gf-open-${game}`).tap();
    await expect(page.locator("#gf-campaign-map")).toBeVisible();
    await expect(page.locator("#gf-levels button")).toHaveCount(10);
    if (game === "baking") {
      const levels = page.locator("#gf-levels button");
      const positions = await levels.evaluateAll((buttons) => buttons.map((button) => {
        const box = button.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      }));
      for (let index = 0; index < positions.length; index++) {
        expect(positions[index].width).toBeGreaterThanOrEqual(44);
        for (const other of positions.slice(index + 1)) {
          const first = positions[index];
          const overlap = first.x < other.x + other.width && first.x + first.width > other.x &&
            first.y < other.y + other.height && first.y + first.height > other.y;
          expect(overlap).toBe(false);
        }
      }
    }
    await expect(page.getByRole("button", { name: "Taso 1", exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Taso 2, lukittu" })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator("#gf-map-back").tap();
    await expect(page.locator(`#gf-open-${game}`)).toBeFocused();
  }
  await page.locator("#gf-open-puzzle").tap();
  await expect(page.locator("#gf-map-progress")).toHaveJSProperty("value", 0);
  await page.getByRole("button", { name: "Taso 1", exact: true }).tap();
  for (let index = 0; index < 2; index++) {
    await page.locator("#gf-hint").tap();
    await page.locator("#gf-board .cue").tap();
  }
  await expect(page.locator("#gf-win")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("voitto-320.png"), fullPage: true });
  await expect(page.locator("#gf-coin-reward")).toHaveText("+25 kisukolikkoa");
  await expect(page.locator("#gf-next-level")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#gf-other").tap();
  await expect(page.locator("#gf-map-title")).toContainText("Palapeli");
  await expect(page.locator("#gf-map-progress")).toHaveJSProperty("value", 1);
  await expect(page.locator("#gf-coins")).toHaveText("25");
  await page.getByRole("button", { name: "Jatka tasolta 2" }).tap();
  await expect(page.locator("#gf-win")).toBeHidden();
  await expect(page.locator("#gf-board .slot")).toHaveCount(2);
  expect(errors).toEqual([]);
});

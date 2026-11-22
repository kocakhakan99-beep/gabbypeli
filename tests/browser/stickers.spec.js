import { test, expect } from "@playwright/test";

test("a returning player earns an illustrated sticker on their second completion", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("gabbypeli-progress-v1")) {
      localStorage.setItem(
        "gabbypeli-progress-v1",
        JSON.stringify({
          version: 1,
          completed: { drawing: 1 },
        }),
      );
    }
  });
  await page.goto("/");
  const book = page.locator("#gf-stickers");
  const bonus = book.locator(".sticker").filter({ hasText: "Sateenkaarikynä" });
  await expect(page.locator("#gf-sticker-count")).toHaveText("1 / 18 tarraa");
  await expect(bonus).not.toHaveClass(/earned/);
  await page.locator("#gf-open-drawing").click();
  await page.locator("#gf-drawing-paper").click();
  await page.locator("#gf-action").click();
  const reward = page.locator("#gf-sticker-reward");
  await expect(reward).toContainText("Sateenkaarikynä");
  await expect(reward.locator(".bonus-art")).toHaveCSS(
    "background-image",
    /dollhouse-stickers\.webp/,
  );
  await page.locator("#gf-other").click();
  await expect(bonus).toHaveClass(/earned/);
  await page.reload();
  await expect(bonus).toHaveClass(/earned/);
  await expect(page.locator("#gf-sticker-count")).toHaveText("2 / 18 tarraa");
  const asset = await page.request.get("/assets/dollhouse-stickers.webp");
  expect(asset.ok()).toBe(true);
});

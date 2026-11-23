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
          completed: { puzzle: 1 },
        }),
      );
    }
  });
  await page.goto("/");
  const book = page.locator("#gf-stickers");
  const bonus = book.locator(".sticker").filter({ hasText: "Sydänpala" });
  await expect(page.locator("#gf-sticker-count")).toHaveText("1 / 24 tarraa");
  await expect(bonus).not.toHaveClass(/earned/);
  await page.locator("#gf-open-puzzle").click();
  for (let index = 0; index < 2; index++) {
    await page.locator("#gf-hint").click();
    await page.locator("#gf-board .cue").click();
  }
  await page.locator("#gf-action").click();
  const reward = page.locator("#gf-sticker-reward");
  await expect(reward).toContainText("Sydänpala");
  await expect(reward.locator(".bonus-art")).toHaveCSS(
    "background-image",
    /stickers\/bonus-1\.webp/,
  );
  await page.locator("#gf-other").click();
  await expect(bonus).toHaveClass(/earned/);
  await page.reload();
  await expect(bonus).toHaveClass(/earned/);
  await expect(page.locator("#gf-sticker-count")).toHaveText("2 / 24 tarraa");
  const asset = await page.request.get("/assets/dollhouse-stickers.webp");
  expect(asset.ok()).toBe(true);
});

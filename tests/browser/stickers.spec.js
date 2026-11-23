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
  async function finishPuzzle() {
    for (let index = 0; index < 2; index++) {
      await page.locator("#gf-hint").click();
      await page.locator("#gf-board .cue").click();
    }
    await expect(page.locator("#gf-win")).toBeVisible();
  }

  await page.locator("#gf-open-puzzle").click();
  await finishPuzzle();
  await expect(page.locator("#gf-coin-reward")).toBeHidden();
  await expect(page.locator("#gf-sticker-reward")).toBeHidden();
  await page.locator("#gf-other").click();

  await page.locator("#gf-campaign-toggle").click();
  await page.locator("#gf-map-puzzle").click();
  await expect(page.getByRole("button", { name: "Taso 2, lukittu" })).toBeDisabled();
  await page.getByRole("button", { name: "Taso 1", exact: true }).click();
  await finishPuzzle();
  await expect(page.locator("#gf-coin-reward")).toHaveText("+25 kisukolikkoa");
  const reward = page.locator("#gf-sticker-reward");
  await expect(reward).toContainText("Sydänpala");
  await expect(reward.locator(".bonus-art")).toHaveCSS(
    "background-image",
    /stickers\/bonus-1\.webp/,
  );
  await page.locator("#gf-again").click();
  await finishPuzzle();
  await expect(page.locator("#gf-coin-reward")).toHaveText("Taso suoritettu uudelleen!");
  await expect(reward).toBeHidden();
  await page.locator("#gf-other").click();
  await expect(page.locator("#gf-coins")).toHaveText("25");
  await expect(page.getByRole("button", { name: "Taso 2", exact: true })).toBeEnabled();
  await expect(bonus).toHaveClass(/earned/);
  await page.reload();
  await expect(page.locator("#gf-coins")).toHaveText("25");
  await expect(bonus).toHaveClass(/earned/);
  await expect(page.locator("#gf-sticker-count")).toHaveText("2 / 24 tarraa");
  const asset = await page.request.get("/assets/stickers/bonus-1.webp");
  expect(asset.ok()).toBe(true);
});

import { test, expect } from "@playwright/test";
test("garden room and its illustrated watering can load", async ({ page }) => {
  await page.goto("/");
  await page.locator("#gf-open-garden").click();
  await page.getByRole("button", { name: "Kukkapenkit", exact: true }).click();
  await expect(page.locator("#gf-garden-field")).toHaveClass(/phaser-garden-ready/);
  await expect(page.locator(".game-panel")).toHaveCSS(
    "background-image",
    /room-garden\.webp/,
  );
  expect(
    (await page.request.get("/assets/furniture/watering.webp")).ok(),
  ).toBeTruthy();
  await expect(page.locator(".garden-bud").first()).toHaveCSS(
    "animation-name",
    "bud-sway",
  );
});
test("reduced motion turns off decorative animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#gf-open-garden").click();
  await page.getByRole("button", { name: "Kukkapenkit", exact: true }).click();
  await expect(page.locator(".garden-bud").first()).toHaveCSS(
    "animation-name",
    "none",
  );
});

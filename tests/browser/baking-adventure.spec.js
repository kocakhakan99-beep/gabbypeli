import { test, expect } from "@playwright/test";

const recipes = [
  ["Piparit", [["Kauli taikina", 1], ["Paina kissamuottia", 2]], ["Strösseli", "Tähti"], 175],
  ["Kuppikakut", [["Aseta vuoka", 2], ["Täytä vuoka", 2]], ["Mustikka", "Mansikka"], 200],
  ["Korvapuustit", [["Kauli levy", 1], ["Levitä täyte", 1], ["Rullaa levy", 1], ["Leikkaa viipale", 2]], ["Kuorrute"], 200],
  ["Marjatortut", [["Painele taikina", 1]], ["Mansikka", "Mustikka"], 175],
];

async function action(page, name, count = 1) {
  for (let index = 0; index < count; index++)
    await page.getByRole("button", { name, exact: true }).press("Enter");
}

async function wash(page) {
  for (const name of ["Avaa hana", "Ota saippuaa", "Pese kädet", "Huuhtele kädet", "Kuivaa kädet"])
    await action(page, name);
}

test("ten bakery orders progress in Adventure and use the same wash visit", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 320, height: 740 });
  const failedImages = [];
  page.on("response", (response) => {
    if (response.url().includes("/assets/gabby/bakery/sets/") && !response.ok())
      failedImages.push(response.url());
  });
  await page.goto("/");
  await page.locator("#gf-sound").click();
  await page.locator("#gf-campaign-toggle").click();
  await page.locator("#gf-open-baking").click();
  await action(page, "Taso 1");
  const orders = [[0, 2], [0, 3], [1, 2], [1, 3], [2, 2], [2, 3], [3, 1], [3, 1], [1, 4], [3, 1]];
  for (const [index, [recipeId, count]] of orders.entries()) {
    const level = index + 1;
    const [name, steps, decorations, heat] = recipes[recipeId];
    const assetSet = ["cookie", "cupcake", "bun", "tart"][recipeId];
    if (level === 10) {
      await expect(page.locator(".bakery-recipe")).toHaveCount(4);
      await action(page, name);
    }
    await expect(page.locator("#gf-instruction")).toContainText(name);
    await action(page, "Aloita tilaus");
    if (level === 1) await wash(page);
    else await expect(page.locator(".baking-wash")).toHaveCount(0);
    if ([2, 4, 6, 8, 9, 10].includes(level)) {
      for (const name of ["Lisää jauhot", "Lisää muna", "Lisää maito"]) await action(page, name);
      const bowl = page.locator(".bakery-bowl.mixing");
      const presses = [2, 2, 3, 3, 3, 4, 4, 4, 5, 5][level - 1];
      for (let index = 0; index < presses; index++) await bowl.press("Enter");
    }
    for (const [step, minimum] of steps)
      await action(page, step, minimum === 2 || step === "Leikkaa viipale" ? count : minimum);
    if (recipeId === 0 || recipeId === 2) {
      await action(page, "Aseta leivinpaperi pellille");
      for (const portion of await page.locator(".bakery-dough > div").all()) await portion.press("Enter");
    }
    await action(page, "Avaa uunin luukku");
    await action(page, "Siirrä pelti uuniin");
    await action(page, "Sulje uunin luukku");
    const dial = page.getByRole("slider", { name: "Uunin lämpötila" });
    for (let index = 0; index < heat / 25; index++) await dial.press("ArrowUp");
    if ([4, 9].includes(level)) await action(page, "Lisää kuorrute", count);
    if (level === 9) {
      await action(page, "Mansikka");
      await expect(page.locator(".bakery-decoration-status")).toHaveText("0 / 4");
    }
    if (![1, 3, 5].includes(level)) {
      if (recipeId === 3) {
        await action(page, "Täytä torttu");
        await action(page, decorations[0]);
        if (level === 8) await action(page, decorations[1]);
      } else await action(page, decorations[0], count);
    }
    const result = page.getByRole("img", { name, exact: true });
    await expect(result).toBeVisible();
    await expect(result).toHaveAttribute("src", new RegExp(`/bakery/sets/${assetSet}/`));
    expect(await page.locator("#gf-result-details img").evaluateAll(
      (images, slug) => images.every((image) => image.src.includes(`/bakery/sets/${slug}/`)), assetSet,
    )).toBe(true);
    await expect(page.locator("#gf-coin-reward")).toHaveText("+25 kisukolikkoa");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (level < 10) await page.locator("#gf-next-level").click();
    else await expect(page.locator("#gf-next-level")).toBeHidden();
  }
  await page.locator("#gf-other").click();
  await expect(page.locator("#gf-coins")).toHaveText("250");
  await expect(page.locator("#gf-levels button[data-completed=true]")).toHaveCount(10);
  expect(failedImages).toEqual([]);
});

for (const saved of [4, 7, 10]) {
  test(`bakery preserves a previous Adventure save at level ${saved}`, async ({ page }) => {
    await page.addInitScript((level) => localStorage.setItem("gabbypeli-campaign-baking-v1", String(level)), saved);
    await page.goto("/");
    await page.locator("#gf-campaign-toggle").click();
    await page.locator("#gf-open-baking").click();
    await expect(page.locator("#gf-levels button[data-completed=true]")).toHaveCount(saved);
    await expect(page.locator("#gf-coins")).toHaveText(String(saved * 25));
    if (saved === 10) await expect(page.locator("#gf-campaign-resume")).toBeHidden();
    else {
      await page.locator("#gf-campaign-resume").click();
      await expect(page.locator("#gf-instruction")).toContainText(saved === 4 ? "Korvapuustit" : "Marjatortut");
      await action(page, "Aloita tilaus");
      await expect(page.getByRole("button", { name: "Avaa hana" })).toBeEnabled();
    }
  });
}

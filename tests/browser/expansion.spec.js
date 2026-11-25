import { test, expect } from "@playwright/test";

async function mutedGame(page) {
  await page.goto("/");
  await page.locator("#gf-sound").click();
}

for (const width of [320, 390, 768, 1100]) {
  test(`baking is playable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    if (width === 390) await page.emulateMedia({ reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await mutedGame(page);
    await expect(page.locator("#gf-stickers .sticker")).toHaveCount(24);
    await page.screenshot({
      path: testInfo.outputPath("playroom.png"),
      fullPage: true,
    });
    await page.locator("#gf-open-baking").click();
    const piparit = width <= 390;
    const servings = width === 390 ? 1 : 6;
    if (servings === 1) await page.getByLabel("Annoksia").selectOption("1");
    await page
      .getByRole("button", { name: piparit ? "Piparit" : "Kuppikakut" })
      .click();
    await page.getByRole("button", { name: "Avaa hana" }).press("Enter");
    await page.getByRole("button", { name: "Ota saippuaa" }).press("Enter");
    for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Pese kädet" }).press("Enter");
    await page.getByRole("button", { name: "Huuhtele kädet" }).press("Enter");
    for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Kuivaa kädet" }).press("Enter");
    const ingredients = [
      ["Lisää jauhot", "flour"],
      ["Lisää muna", "egg"],
      ["Lisää maito", "milk"],
    ];
    for (const [name, frame] of ingredients) {
      const ingredient = page.getByRole("button", { name });
      await expect(ingredient).toBeVisible();
      const sprite = ingredient.locator(".bakery-texture");
      await expect(sprite.locator("image")).toHaveAttribute("href", `./assets/gabby/bakery/sets/${piparit ? "cookie" : "cupcake"}/atlas.webp`);
      await expect(sprite).toHaveAttribute("data-frame", frame);
      await expect(sprite).toBeVisible();
    }
    await page.locator(".bakery-ingredients").screenshot({
      path: testInfo.outputPath("bakery-ingredients.png"),
    });
    for (const [index, [name]] of ingredients.entries()) {
      const ingredient = page.getByRole("button", { name });
      await ingredient.press("Enter");
      await expect(ingredient).toBeHidden();
      if (index < 2) await expect(page.locator(".bakery-bowl-art")).toHaveAttribute("data-frame", `bowl-contents-${(1 << (index + 1)) - 1}`);
    }
    for (let i = 0; i < 6; i++)
      await page.locator(".bakery-bowl.mixing").press("Enter");
    for (const [step, count] of piparit
      ? [["Kauli taikina", 6], ["Paina kissamuottia", servings * 2]]
      : [["Aseta vuoka", 6], ["Täytä vuoka", 6]]) {
      for (let index = 0; index < count; index++)
        await page.getByRole("button", { name: step }).press("Enter");
    }
    if (piparit) {
      await page.getByRole("button", { name: "Aseta leivinpaperi pellille" }).press("Enter");
      await expect(page.locator(".bakery-dough > div").first()).toBeEnabled();
      for (const portion of await page.locator(".bakery-dough > div").all())
        await portion.press("Enter");
    }
    const oven = page.locator(".bakery-oven");
    await expect(oven.locator('[data-frame="oven_body"] image')).toHaveAttribute("href", /sets\/oven\/atlas\.webp/);
    await expect(oven.locator(".bakery-temp")).toHaveText("0 °C");
    await page
      .getByRole("button", { name: "Avaa uunin luukku" })
      .press("Enter");
    await page
      .getByRole("button", { name: "Siirrä pelti uuniin" })
      .press("Enter");
    await page
      .getByRole("button", { name: "Sulje uunin luukku" })
      .press("Enter");
    const dial = page.getByRole("slider", { name: "Uunin lämpötila" });
    for (let i = 0; i < (piparit ? 7 : 8); i++) await dial.press("ArrowUp");
    await expect(dial).toHaveAttribute(
      "aria-valuenow",
      piparit ? "175" : "200",
    );
    await expect(oven.locator(".bakery-temp")).toHaveText(piparit ? "175 °C" : "200 °C");
    await expect(oven.locator(".oven-cooking")).toHaveCSS("background-image", /^radial-gradient\(/);
    await oven.screenshot({ path: testInfo.outputPath("oven-cooking.png") });
    if (!piparit) {
      for (let index = 0; index < 6; index++)
        await page.getByRole("button", { name: "Lisää kuorrute" }).press("Enter");
    }
    const topping = page.getByRole("button", { name: piparit ? "Strösseli" : "Mustikka", exact: true });
    for (let index = 0; index < servings; index++) await topping.press("Enter");
    await expect(page.locator("#gf-win")).toBeVisible();
    const result = page.getByRole("img", { name: piparit ? "Piparit" : "Kuppikakut" });
    await expect(result).toBeVisible();
    await expect.poll(() => result.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
    await page.locator("#gf-other").click();
    await expect(page.locator("#gf-stickers .earned")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("#gf-stickers .earned")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("memory pairs and all puzzle sizes finish through visible buttons", async ({
  page,
}) => {
  await mutedGame(page);
  await page.locator("#gf-open-memory").click();
  for (const count of [2, 3, 4]) {
    await page
      .locator("#gf-memory-settings")
      .getByRole("button", { name: `${count} paria` })
      .click();
    const cards = await page
      .locator("#gf-cards button")
      .evaluateAll((buttons) =>
        buttons.map((button) =>
          button.getAttribute("aria-label").replace(/^Kortti \d+: /, ""),
        ),
      );
    await page.locator("#gf-cards .faceup").first().press("Enter");
    const groups = Object.groupBy(
      cards.map((name, index) => ({ name, index })),
      (card) => card.name,
    );
    for (const group of Object.values(groups)) {
      for (const card of group)
        await page.locator("#gf-cards button").nth(card.index).click();
    }
    await expect(page.locator("#gf-win")).toBeVisible();
    await page.locator("#gf-again").click();
  }
  await page.locator("#gf-home-button").click();
  await page.locator("#gf-open-puzzle").click();
  for (const count of [2, 4, 6]) {
    await page
      .locator("#gf-puzzle-settings")
      .getByRole("button", { name: `${count} palaa` })
      .click();
    for (let piece = 0; piece < count; piece++) {
      await page.locator(`#gf-tray button[data-piece="${piece}"]`).click();
      await page.locator(`#gf-board button[data-piece="${piece}"]`).click();
    }
    await expect(page.locator("#gf-win")).toBeVisible();
    await page.locator("#gf-again").click();
  }
});

test("learning and picture hunt still complete after TypeScript migration", async ({
  page,
}) => {
  await mutedGame(page);
  await page.locator("#gf-open-find").click();
  for (const friend of [
    "Gabby",
    "Hile",
    "Merikatti",
    "Kisukeiju",
    "Pandi Pörrö",
    "DJ Catnip",
  ]) {
    for (const spot of await page.locator(".hide-spot").all()) {
      if ((await page.locator("#gf-feedback").textContent()).includes("Löysit kaverin!")) break;
      await spot.press("Enter");
    }
    await expect(page.locator("#gf-feedback")).toContainText(friend);
    if (friend !== "DJ Catnip") await page.locator(".find-next-door").press("Enter");
  }
  await expect(page.locator("#gf-win")).toBeVisible();
});

test("adult sound preferences persist and a blocked save does not stop play", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#gf-settings-toggle").click();
  await page.locator("#gf-speech-enabled").uncheck();
  await page.locator("#gf-effects-enabled").uncheck();
  await page.locator("#gf-volume").fill("25");
  await page.reload();
  await page.locator("#gf-settings-toggle").click();
  await expect(page.locator("#gf-speech-enabled")).not.toBeChecked();
  await expect(page.locator("#gf-effects-enabled")).not.toBeChecked();
  await expect(page.locator("#gf-volume")).toHaveValue("25");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
  });
  await page.locator("#gf-speech-enabled").check();
  await page.locator("#gf-open-baking").click();
  await expect(page.locator("#gf-baking")).toBeVisible();
});

test("object memory and puzzle use the new art without device speech", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.deviceSpeechCalls = 0;
    if (window.speechSynthesis)
      window.speechSynthesis.speak = () => window.deviceSpeechCalls++;
  });
  await page.goto("/");
  await page.locator("#gf-open-memory").click();
  await page
    .locator("#gf-memory-packs")
    .getByRole("button", { name: "Esineet", exact: true })
    .click();
  await expect(page.locator("#gf-cards [data-object]")).toHaveCount(4);
  await page.locator("#gf-cards button").first().press("Enter");
  await page.locator("#gf-cards button").first().click();
  await expect(page.locator("#gf-feedback")).toContainText("samanlainen");
  await page.locator("#gf-home-button").click();
  await page.locator("#gf-open-puzzle").click();
  await expect(page.locator("#gf-scenes button")).toHaveCount(15);
  await page
    .getByRole("button", { name: "Palapeli: Vene", exact: true })
    .click();
  await expect(page.locator("#gf-title")).toContainText("Vene");
  const crop = page.locator("#gf-board .crop").first();
  await expect(crop).toHaveCSS("background-image", /objects\/boat\.webp/);
  await expect(crop).toHaveCSS("background-size", "200% 100%");
  await page.locator("#gf-tray [data-piece='0']").click();
  await page.locator("#gf-board [data-piece='0']").click();
  await expect(page.locator("#gf-board .filled")).toHaveCount(1);
  await page.locator("#gf-home-button").click();
  await page.locator("#gf-open-garden").click();
  await page.locator("#gf-repeat").click();
  await expect(page.locator("#gf-feedback")).toBeVisible();
  expect(await page.evaluate(() => window.deviceSpeechCalls)).toBe(0);
});

test("Sandbox exposes all bakery recipes and applies independent play settings", async ({ page }) => {
  await page.goto("/");
  await page.locator("#gf-free-toggle").click();
  await page.locator("#gf-open-baking").click();
  await expect(page.locator(".bakery-recipe")).toHaveText(["Piparit", "Kuppikakut", "Korvapuustit", "Marjatortut"]);
  await page.getByLabel("Annoksia").selectOption("2");
  await page.getByLabel("Käsienpesu", { exact: true }).uncheck();
  await page.getByLabel("Tee taikina itse").uncheck();
  await page.getByLabel("Koristelu", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Kuppikakut", exact: true }).click();
  await expect(page.locator(".baking-wash, .bakery-ingredients")).toHaveCount(0);
  await page.getByRole("button", { name: "Aseta vuoka" }).press("Enter");
  await expect(page.locator(".bakery-step-count")).toHaveText("1 / 2");
  await page.getByRole("button", { name: "Aseta vuoka" }).press("Enter");
  for (let index = 0; index < 2; index++) await page.getByRole("button", { name: "Täytä vuoka" }).press("Enter");
  for (const name of ["Avaa uunin luukku", "Siirrä pelti uuniin", "Sulje uunin luukku"])
    await page.getByRole("button", { name }).press("Enter");
  for (let index = 0; index < 8; index++) await page.getByRole("slider", { name: "Uunin lämpötila" }).press("ArrowUp");
  await expect(page.getByRole("img", { name: "Kuppikakut" })).toBeVisible();
  await expect(page.locator(".bakery-decorations")).toHaveCount(0);
});

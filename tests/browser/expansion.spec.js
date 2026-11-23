import { test, expect } from "@playwright/test";

async function mutedGame(page) {
  await page.goto("/");
  await page.locator("#gf-sound").click();
}

for (const width of [320, 768, 1100]) {
  test(`baking and bubbles are playable at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await mutedGame(page);
    await expect(page.locator("#gf-stickers .sticker")).toHaveCount(18);
    await page.screenshot({
      path: testInfo.outputPath("playroom.png"),
      fullPage: true,
    });
    await page.locator("#gf-open-baking").click();
    await page.locator("#gf-baking-check").click();
    await expect(page.locator("#gf-feedback")).toContainText("lisää");
    for (let target of [2, 1, 3, 4]) {
      // An extra cake can be removed directly from the plate.
      for (let i = 0; i < target + 1; i++)
        await page.locator("#gf-baking-add").click();
      await page.locator("#gf-baking-check").click();
      await expect(page.locator("#gf-feedback")).toContainText("liikaa");
      await page.locator("#gf-baking-plate button").first().click();
      await page.locator("#gf-baking-check").click();
      await page.locator("#gf-baking-bake").click();
      await expect(page.locator("#gf-baking-toppings")).toBeVisible();
      for (const cake of await page.locator("#gf-baking-plate button").all())
        await cake.click();
      await page.locator("#gf-baking-check").click();
      await page.locator("#gf-action").click();
    }
    await expect(page.locator("#gf-win")).toBeVisible();
    await page.locator("#gf-other").click();
    await expect(page.locator("#gf-stickers .earned")).toHaveCount(1);
    await page.reload();
    await expect(page.locator("#gf-stickers .earned")).toHaveCount(1);
    await page.locator("#gf-sound").click();
    await page.locator("#gf-open-bubbles").click();
    for (const kind of ["blue", "pink", "square", "blue"]) {
      const correct = page.locator(
        `#gf-bubble-field button.${kind}:not(:disabled)`,
      );
      while (await correct.count()) {
        await correct.first().click();
      }
      await page.locator("#gf-action").click();
    }
    await expect(page.locator("#gf-win")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("celebration.png"),
      fullPage: true,
    });
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
    await page.locator("#gf-action").click();
    const groups = Object.groupBy(
      cards.map((name, index) => ({ name, index })),
      (card) => card.name,
    );
    for (const group of Object.values(groups)) {
      for (const card of group)
        await page.locator("#gf-cards button").nth(card.index).click();
    }
    await page.locator("#gf-action").click();
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
    await page.locator("#gf-action").click();
    await expect(page.locator("#gf-win")).toBeVisible();
    await page.locator("#gf-again").click();
  }
});

test("learning and picture hunt still complete after TypeScript migration", async ({
  page,
}) => {
  await mutedGame(page);
  await page.locator("#gf-open-learn").click();
  for (const answer of [
    "Sininen",
    "Kaksi",
    "Ympyrä",
    "Kolme",
    "Keltainen",
    "Hile",
    "Kastelukannu",
    "Vene",
    "Kuppikakut",
  ]) {
    await page
      .locator("#gf-choices")
      .getByRole("button", { name: answer, exact: true })
      .click();
    await page.locator("#gf-action").click();
  }
  await expect(page.locator("#gf-win")).toBeVisible();
  await page.locator("#gf-other").click();
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
      if (await page.locator("#gf-action").isVisible()) break;
      await spot.click();
    }
    await expect(page.locator("#gf-feedback")).toContainText(friend);
    await page.locator("#gf-action").click();
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
    .getByRole("button", { name: "Esineet" })
    .click();
  await expect(page.locator("#gf-cards [data-object]")).toHaveCount(4);
  await page.locator("#gf-action").click();
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
  await expect(crop).toHaveCSS("background-image", /play-objects\.webp/);
  await expect(crop).toHaveCSS("background-size", "600% 300%");
  await page.locator("#gf-tray [data-piece='0']").click();
  await page.locator("#gf-board [data-piece='0']").click();
  await expect(page.locator("#gf-board .filled")).toHaveCount(1);
  await page.locator("#gf-home-button").click();
  await page.locator("#gf-open-garden").click();
  await page.locator("#gf-repeat").click();
  await expect(page.locator("#gf-feedback")).toContainText("Liu");
  expect(await page.evaluate(() => window.deviceSpeechCalls)).toBe(0);
});

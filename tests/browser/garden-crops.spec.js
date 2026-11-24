import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });

async function openCrop(page, name) {
  await page.goto("/");
  await page.locator("#gf-open-garden").tap();
  await page.getByRole("button", { name: "Kasvata oma kasvi" }).tap();
  await page.getByRole("button", { name, exact: true }).tap();
}

const crops = [
  ["Mansikka", "strawberry", "Poimi mansikat", "post_harvest"],
  ["Auringonkukka", "sunflower", "Kerää siemenet", "seed_head"],
  ["Porkkana", "carrot", "Nosta porkkana", "harvested"],
  ["Taikakukka", "magic_flower", "Kerää taikaterälehti", "post_harvest"],
];

for (const [name, id, harvest, ending] of crops) {
  test(`the ${id} crop reaches harvest without loading another crop`, async ({ page }, testInfo) => {
    if (id === "sunflower") await page.setViewportSize({ width: 1280, height: 900 });
    const paths = [];
    page.on("request", (request) => {
      if (request.url().includes("/nabby-garden-v6/")) paths.push(new URL(request.url()).pathname);
    });
    await openCrop(page, name);
    const field = page.locator("#gf-garden-field");
    const art = field.locator(".garden-crop-art");
    await expect(art).toHaveClass(/garden-crop-rendered/);
    const tool = field.locator(".garden-crop-tool");
    for (const step of ["Kuohkeuta multa", "Kylvä siemen", "Kastele siemen", "Kastele itu", "Siisti kasvupaikka", "Kastele kasvi", harvest]) {
      await expect(tool).toHaveText(step);
      if (step === "Kastele siemen") {
        await tool.tap();
        await expect(tool).toHaveText(step);
      }
      await field.locator(".garden-crop-tool:visible, .garden-crop-plot[data-work]:not([data-work=''])").press("Enter");
    }
    await expect(field).toHaveAttribute("data-crop-frame", `${id}_${ending}`);
    await field.screenshot({ path: testInfo.outputPath("garden-harvest.png"), animations: "disabled" });
    await page.getByRole("button", { name: "Siirrä sato koriin" }).press("Enter");
    await expect(page.locator("#gf-win")).toBeVisible();
    await expect(page.locator("#gf-coin-reward")).toBeHidden();
    await expect(field.locator("canvas")).toHaveCount(0);
    expect(paths.sort()).toEqual([
      `/assets/nabby-garden-v6/${id}/${id}.json`,
      `/assets/nabby-garden-v6/${id}/${id}.webp`,
      `/assets/nabby-garden-v6/${id}/seed.webp`,
    ].sort());
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("garden tools give feedback on a missed drag and preserve the phase", async ({ page }) => {
  await openCrop(page, "Porkkana");
  const field = page.locator("#gf-garden-field");
  await expect(field.locator(".garden-crop-art")).toHaveClass(/garden-crop-rendered/);
  const tool = field.locator(".garden-crop-tool");
  await tool.scrollIntoViewIfNeeded();
  const box = await tool.boundingBox();
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(2, start.y, { steps: 5 });
  await page.mouse.up();
  await expect(field).toHaveAttribute("data-crop-phase", "0");
  await expect(page.locator("#gf-feedback")).toContainText("Kokeile kasvupaikkaa");
  const plot = await field.locator(".garden-crop-plot").boundingBox();
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(plot.x + plot.width / 2, plot.y + plot.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(field).toHaveAttribute("data-crop-phase", "1");
  await page.locator("#gf-home-button").tap();
  await expect(field.locator("canvas")).toHaveCount(0);
});

test("garden controls remain playable when the crop texture fails", async ({ page }) => {
  await page.route("**/nabby-garden-v6/strawberry/strawberry.webp", (route) => route.abort());
  await openCrop(page, "Mansikka");
  const field = page.locator("#gf-garden-field");
  const tool = field.locator(".garden-crop-tool");
  await harvestCrop(page);
  await expect(field).toHaveAttribute("data-crop-frame", "strawberry_post_harvest");
  await page.getByRole("button", { name: "Siirrä sato koriin" }).press("Enter");
  await expect(page.locator("#gf-win")).toBeVisible();
});

async function harvestCrop(page) {
  const object = page.locator(".garden-crop-tool:visible, .garden-crop-plot[data-work]:not([data-work=''])");
  for (let phase = 0; phase < 7; phase++) await object.press("Enter");
}

test("garden Adventure unlocks ten levels and pays only once per level", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await page.locator("#gf-campaign-toggle").tap();
  await page.locator("#gf-open-garden").tap();
  await page.locator("#gf-campaign-resume").tap();
  const orders = [
    ["Mansikka"], ["Auringonkukka"], ["Porkkana"], ["Taikakukka"],
    ["Mansikka", "Porkkana"], ["Auringonkukka", "Taikakukka"],
    ["Porkkana", "Auringonkukka"], ["Taikakukka", "Mansikka"],
    ["Mansikka", "Porkkana", "Auringonkukka"], ["Auringonkukka", "Porkkana", "Taikakukka"],
  ];
  const list = page.locator("#gf-garden-order");
  const field = page.locator("#gf-garden-field");
  for (const [level, order] of orders.entries()) {
    await expect(list.locator("li")).toHaveText(order);
    for (const [index, name] of order.entries()) {
      await expect(list.locator("[aria-current=step]")).toHaveText(name);
      await expect(field.locator(".garden-crop-plot")).toHaveCount(1);
      await harvestCrop(page);
      await expect(list.locator("[data-harvested=true]")).toHaveCount(index + 1);
      if (index < order.length - 1) await expect(page.locator("#gf-win")).toBeHidden();
      await page.getByRole("button", { name: "Siirrä sato koriin" }).press("Enter");
    }
    await expect(page.locator("#gf-win")).toBeVisible();
    await expect(page.locator("#gf-coin-reward")).toHaveText("+25 kisukolikkoa");
    await expect(field.locator("canvas")).toHaveCount(0);
    if (level < orders.length - 1) await page.locator("#gf-next-level").tap();
  }
  await expect(page.locator("#gf-next-level")).toBeHidden();
  await page.locator("#gf-other").tap();
  await expect(page.locator("#gf-coins")).toHaveText("250");
  await expect(page.locator('#gf-levels button[data-completed="true"]')).toHaveCount(10);
  await page.locator("#gf-levels button").first().tap();
  await harvestCrop(page);
  await page.getByRole("button", { name: "Siirrä sato koriin" }).press("Enter");
  await expect(page.locator("#gf-coin-reward")).toHaveText("Taso suoritettu uudelleen!");
  await page.locator("#gf-other").tap();
  await expect(page.locator("#gf-coins")).toHaveText("250");
});

test("garden Adventure preserves old progress and restarts an interrupted bed", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("gabbypeli-campaign-garden-v1", "7"));
  await page.goto("/");
  await page.locator("#gf-campaign-toggle").tap();
  await page.locator("#gf-open-garden").tap();
  await expect(page.locator('#gf-levels button[data-completed="true"]')).toHaveCount(7);
  await expect(page.locator("#gf-coins")).toHaveText("175");
  await page.locator("#gf-campaign-resume").tap();
  await harvestCrop(page);
  await page.getByRole("button", { name: "Siirrä sato koriin" }).press("Enter");
  await expect(page.locator("#gf-garden-order [aria-current=step]")).toHaveText("Mansikka");
  await page.locator("#gf-home-button").tap();
  await expect(page.locator("#gf-garden-field canvas")).toHaveCount(0);
  await expect(page.locator('#gf-levels button[data-completed="true"]')).toHaveCount(7);
  await page.locator("#gf-campaign-resume").tap();
  await expect(page.locator("#gf-garden-order [aria-current=step]")).toHaveText("Taikakukka");
  await expect(page.locator("#gf-garden-field")).toHaveAttribute("data-crop-phase", "0");
});

test("Sandbox lets the player choose a mode and three crops independently", async ({ page }) => {
  await page.goto("/");
  await page.locator("#gf-free-toggle").tap();
  await page.locator("#gf-open-garden").tap();
  await expect(page.getByRole("group", { name: "Kasvatuksen asetukset" })).toBeVisible();
  await page.getByLabel("Kasvupaikkoja").selectOption("3");
  await page.getByLabel("Kasvi 2").selectOption("magic_flower");
  await page.getByLabel("Kasvi 3").selectOption("strawberry");
  await page.getByRole("button", { name: "Porkkana", exact: true }).tap();
  await expect(page.locator("#gf-garden-order li")).toHaveText(["Porkkana", "Taikakukka", "Mansikka"]);
  for (const name of ["Porkkana", "Taikakukka", "Mansikka"]) {
    await expect(page.locator("#gf-garden-order [aria-current=step]")).toHaveText(name);
    await harvestCrop(page);
    await page.getByRole("button", { name: "Siirrä sato koriin" }).press("Enter");
  }
  await expect(page.locator("#gf-win")).toBeVisible();
  await expect(page.locator("#gf-coin-reward")).toBeHidden();
});

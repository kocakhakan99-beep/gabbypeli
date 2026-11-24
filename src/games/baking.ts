import { campaignLevel } from "../campaign.js";
import { ding, say, unlock } from "../audio.js";
import { el } from "../dom.js";
import {
  feedback,
  finish,
  heading,
  iconButton,
  progress,
  setAction,
} from "../ui.js";
import { bindStroke, stopStroke, type Point } from "./stroke.js";
import type { BakingTrayView, MixingView } from "../phaser-room.js";

import { orders, recipes, bakeryAsset, type BakingStep, type Recipe, type RecipeId } from "./baking-recipes.js";

let washed = false;

export function resetBakingVisit(): void {
  washed = false;
}

let timer: ReturnType<typeof setTimeout> | undefined;
let mixingView: MixingView | undefined;
let trayView: BakingTrayView | undefined;
let mixingGeneration = 0;

function stopMixingView(): void {
  mixingGeneration++;
  mixingView?.destroy();
  mixingView = undefined;
  trayView?.destroy();
  trayView = undefined;
}

export function stopBakingGestures(): void {
  stopMixingView();
  clearTimeout(timer);
  el("baking")
    .querySelectorAll<HTMLElement>("[data-gesture]")
    .forEach(stopStroke);
  el("baking").replaceChildren();
}

export function startBaking(): void {
  stopBakingGestures();
  const game = el("baking");
  const adventure = campaignLevel();
  const order = adventure === undefined ? undefined : orders[adventure - 1];
  let portionCount = order?.count ?? 6;
  let selectedRecipe: RecipeId;
  let washEnabled = true;
  let mixEnabled = true;
  let decorationsEnabled = true;
  const mixDough = () => order?.mix ?? mixEnabled;
  let stage = 0;
  let total = 1;
  const toppings: string[] = [];
  const mixingGoal = adventure === undefined ? 4 : [2, 2, 3, 3, 3, 4, 4, 4, 5, 5][adventure - 1];
  heading(
    "cakey",
    "Hileen leipomo",
    "Valitse mitä haluat leipoa.",
    "Hileen keittiö",
  );
  const scene = document.createElement("div");
  scene.className = "bakery-scene";
  game.append(scene);
  progress(0, total);

  function show(instruction: string, html: string): void {
    stopMixingView();
    scene.querySelectorAll<HTMLElement>("[data-gesture]").forEach(stopStroke);
    scene.innerHTML = html;
    feedback("");
    el("instruction").textContent = instruction;
    progress(stage++, total);
    const first = scene.querySelector<HTMLElement>("button:not(:disabled), [tabindex='0']");
    first?.focus({ preventScroll: true });
  }

  function sound(): void {
    unlock();
    ding("piece");
  }

  function gesture(
    target: HTMLElement,
    handlers: Parameters<typeof bindStroke>[1],
  ): void {
    target.dataset.gesture = "";
    bindStroke(target, handlers);
  }

  function transfer(
    item: HTMLElement,
    destination: HTMLElement,
    accept: (point?: Point) => void,
  ): void {
    let start: Point;
    let misses = 0;
    let dragged = false;
    item.addEventListener("click", (event) => {
      if (dragged && event.detail > 0) event.stopImmediatePropagation();
    }, { capture: true });
    gesture(item, {
      start(point) {
        start = point;
        dragged = false;
      },
      move(_from, point) {
        item.style.translate =
          point.x - start.x + "px " + (point.y - start.y) + "px";
      },
      end(point) {
        item.style.removeProperty("translate");
        if (!point || Math.hypot(point.x - start.x, point.y - start.y) < 8)
          return;
        dragged = true;
        const box = destination.getBoundingClientRect();
        if (
          point.x >= box.left - 12 &&
          point.x <= box.right + 12 &&
          point.y >= box.top - 12 &&
          point.y <= box.bottom + 12
        )
          accept(point);
        else {
          feedback(misses ? "Kokeile korostettua kohdetta." : "Vie väline työpinnalle tai ohjeessa näkyvään kohteeseen.");
          if (++misses >= 2) destination.classList.add("bakery-drop-hint");
        }
      },
    });
    if (item instanceof HTMLButtonElement) {
      item.onclick = (event) => { if (event.detail === 0) accept(); };
      return;
    }
    item.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      accept();
    });
  }

  const recipeAsset = (asset: string) => new URL(bakeryAsset(selectedRecipe, asset), document.baseURI).href;
  const image = (asset: string, set: RecipeId | "wash" = selectedRecipe) =>
    `<img src="${bakeryAsset(set, asset)}" alt="" draggable="false">`;
  const washAsset = (asset: string) => bakeryAsset("wash", asset);
  const piece = (recipe: Recipe) => `<span class="bakery-piece">${image(recipe.raw)}</span>`;
  const decorate = () => order ? selectedRecipe === "tart" || order.finish : decorationsEnabled;

  const usesParchment = () => selectedRecipe === "cookie" || selectedRecipe === "bun";

  function prepare(recipe: Recipe): void {
    runSteps(recipe.prepare, () => {
      if (usesParchment()) tray(recipe);
      else oven(recipe);
    });
  }

  function begin(id: RecipeId): void {
    selectedRecipe = id;
    const recipe = recipes[id];
    if (id === "tart") portionCount = 1;
    else if (!order) {
      const quantity = scene.querySelector<HTMLSelectElement>("#gf-baking-quantity")!.value;
      portionCount = quantity === "recipe" ? (id === "bun" ? 4 : 6) : Number(quantity);
    }
    const shouldWash = order ? !washed || adventure === 1 : washEnabled;
    total = 1 + Number(usesParchment()) + recipe.prepare.length + (shouldWash ? 1 : 0) +
      (mixDough() ? 2 : 0) +
      (id === "bun" && decorate() ? 1 : 0) +
      (id === "tart" || decorate() ? recipe.after.length : 0) + (decorate() ? 1 : 0) +
      (order ? 1 : 0);
    const cook = () => {
      if (shouldWash) wash(recipe);
      else if (mixDough()) ingredients(recipe);
      else prepare(recipe);
    };
    if (order) {
      show(
        `Hileen tilaus · ${recipe.name} · ${portionCount} kpl`,
        `<div class="bakery-order-stand" aria-label="Tilausteline">Tilausteline</div>
          <button type="button" class="bakery-order-card" aria-label="Aloita tilaus">${image(recipe.ready)}${recipe.name}</button>
          ${order.requested ? `<p>Hileen toive: ${order.requested.toLowerCase()}.</p>` : ""}`,
      );
      el("instruction").textContent += ". Vedä reseptikortti telineeseen.";
      transfer(scene.querySelector<HTMLButtonElement>(".bakery-order-card")!,
        scene.querySelector<HTMLElement>(".bakery-order-stand")!, cook);
    } else cook();
  }

  if (order?.recipe) {
    begin(order.recipe);
    return;
  }
  if (order) el("instruction").textContent = "Hileen juhlatilaus: valitse yksi resepti.";
  scene.innerHTML = `${order ? "" : `
    <fieldset class="sandbox-game-options">
      <legend>Leipomon asetukset</legend>
      <label>Annoksia <select id="gf-baking-quantity">
        <option value="recipe">Reseptin oletus</option>
        ${[1, 2, 3, 4, 5, 6].map((count) => `<option>${count}</option>`).join("")}
      </select></label>
      <label><input type="checkbox" id="gf-baking-wash" checked> Käsienpesu</label>
      <label><input type="checkbox" id="gf-baking-mix" checked> Tee taikina itse</label>
      <label><input type="checkbox" id="gf-baking-decorate" checked> Koristelu</label>
    </fieldset>`}
    <div class="bakery-recipes">${(Object.keys(recipes) as RecipeId[]).map((id) =>
    `<button type="button" class="bakery-recipe" data-recipe="${id}">${image(recipes[id].ready, id)}${recipes[id].name}</button>`,
  ).join("")}</div>`;
  scene.querySelectorAll<HTMLButtonElement>(".bakery-recipe")
    .forEach((choice) => {
      choice.onclick = () => {
        if (!order) {
          washEnabled = scene.querySelector<HTMLInputElement>("#gf-baking-wash")!.checked;
          mixEnabled = scene.querySelector<HTMLInputElement>("#gf-baking-mix")!.checked;
          decorationsEnabled = scene.querySelector<HTMLInputElement>("#gf-baking-decorate")!.checked;
        }
        begin(choice.dataset.recipe as RecipeId);
      };
    });

  function runSteps(steps: readonly BakingStep[], done: () => void): void {
    const [step, ...remaining] = steps;
    if (!step) {
      done();
      return;
    }
    const count = step.repeat ? portionCount : 1;
    show(step.instruction, `
      <div class="bakery-work-target" aria-label="Työpinta">${image(step.image)}</div>
      <button type="button" class="bakery-step-action" aria-label="${step.action}">${step.tool ? image(step.tool) : image(step.image)}</button>
      <p class="bakery-step-count" aria-live="polite"></p>
      <div class="bakery-step-results" aria-hidden="true"></div>`);
    const target = scene.querySelector<HTMLElement>(".bakery-work-target")!;
    const action = scene.querySelector<HTMLButtonElement>(".bakery-step-action")!;
    const meter = scene.querySelector<HTMLElement>(".bakery-step-count")!;
    const results = scene.querySelector<HTMLElement>(".bakery-step-results")!;
    let completed = 0;
    meter.textContent = `0 / ${count}`;
    function work(): void {
      if (completed === count) return;
      completed++;
      sound();
      meter.textContent = `${completed} / ${count}`;
      if (step.result) results.insertAdjacentHTML("beforeend", image(step.result));
      if (completed === count) {
        action.disabled = true;
        timer = setTimeout(() => runSteps(remaining, done), 450);
      }
    }
    if (step.tool) transfer(action, target, work);
    else {
      action.hidden = true;
      target.tabIndex = 0;
      target.setAttribute("role", "button");
      target.setAttribute("aria-label", step.action);
      target.onkeydown = (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        work();
      };
      target.focus({ preventScroll: true });
      let start: Point;
      gesture(target, {
        start(point) { start = point; },
        move(_previous, point) { target.style.setProperty("--work-offset", `${(point.x - start.x) / 4}px`); },
        end(point) {
          target.style.removeProperty("--work-offset");
          if (point && Math.hypot(point.x - start.x, point.y - start.y) >= 16) work();
        },
      });
    }
    action.onclick = (event) => { if (event.detail === 0) work(); };
  }

  function wash(recipe: Recipe): void {
    show(
      "Käännä hanan vipua sivulle avataksesi veden.",
      `
      <div class="baking-wash">
        <img class="wash-tiles" src="${washAsset("wash-tiles")}" alt="">
        <img class="wash-counter" src="${washAsset("wash-counter")}" alt="">
        <img class="wash-spout" src="${washAsset("wash-spout")}" alt="">
        <span class="wash-stream" aria-hidden="true"></span>
        <button type="button" class="wash-soap wash-object" aria-label="Ota saippuaa" disabled>
          <span class="wash-object-base"></span><span class="wash-object-moving"></span>
        </button>
        <button type="button" class="wash-tap wash-object" aria-label="Avaa hana">
          <span class="wash-object-moving"></span>
        </button>
        <div class="wash-hands">${image("sink", "wash")}
          <button type="button" class="wash-scrub" aria-label="Pese kädet" disabled>
            <img class="wash-state" src="${washAsset("hands-clean")}" alt="" draggable="false">
          </button>
        </div>
        <button type="button" class="wash-dry wash-object" aria-label="Kuivaa kädet" hidden>${image("towel", "wash")}</button>
      </div>`,
    );
    say("Hei pieni ystävä! Leikitään yhdessä.");
    const soap = scene.querySelector<HTMLButtonElement>(".wash-soap")!;
    const tap = scene.querySelector<HTMLButtonElement>(".wash-tap")!;
    const sink = scene.querySelector<HTMLElement>(".baking-wash")!;
    const hands = scene.querySelector<HTMLImageElement>(".wash-state")!;
    const scrub = scene.querySelector<HTMLButtonElement>(".wash-scrub")!;
    const dry = scene.querySelector<HTMLButtonElement>(".wash-dry")!;
    let waterOn = false;
    function handle(
      object: HTMLButtonElement,
      measure: (start: Point, point: Point, distance: number) => number,
      act: () => void,
    ): void {
      let origin: Point;
      let distance = 0;
      gesture(object, {
        start(point) { origin = point; distance = 0; },
        move(from, point) {
          distance += Math.abs(point.x - from.x);
          const movement = Math.max(0, Math.min(1, measure(origin, point, distance)));
          object.style.setProperty("--wash-motion", String(movement));
        },
        end(point) {
          object.style.removeProperty("--wash-motion");
          if (point && !object.disabled && measure(origin, point, distance) >= 1) act();
        },
      });
      object.onclick = (event) => {
        if (event.detail === 0 && !object.disabled) act();
      };
    }

    handle(soap, (start, point) => (point.y - start.y) / 14, () => {
      hands.src = washAsset("hands-soapy");
      sound();
      sink.classList.add("soapy");
      soap.disabled = true;
      scrub.disabled = false;
      scrub.focus({ preventScroll: true });
      el("instruction").textContent = "Hankaa käsiä edestakaisin.";
    });
    handle(scrub, (start, point, distance) => Math.max(distance, Math.abs(point.x - start.x)) / 24, () => {
      scrub.disabled = true;
      tap.setAttribute("aria-label", "Huuhtele kädet");
      tap.disabled = false;
      tap.focus({ preventScroll: true });
      el("instruction").textContent = "Käännä hanaa huuhdellaksesi kädet.";
    });
    handle(tap, (start, point) => Math.abs(point.x - start.x) / 18, () => {
      if (!waterOn) {
        waterOn = true;
        sink.classList.add("rinsing", "wash-water-on");
        tap.disabled = true;
        soap.disabled = false;
        soap.focus({ preventScroll: true });
        el("instruction").textContent = "Paina saippuapumppua alaspäin.";
        return;
      }
      tap.disabled = true;
      sink.classList.add("rinsing");
      timer = setTimeout(() => {
        sink.classList.remove("rinsing", "soapy", "wash-water-on");
        hands.src = washAsset("hands-wet");
        dry.hidden = false;
        el("instruction").textContent = "Vedä pyyhe käsien päälle.";
        dry.focus({ preventScroll: true });
      }, 650);
    });
    const towel = dry.querySelector("img")!;
    let towelOrigin: Point;
    let wiped = false;

    function overBasin(point: Point): boolean {
      const target = scrub.parentElement!.getBoundingClientRect();
      const inset = 14;
      return point.x >= target.left - inset && point.x <= target.right + inset &&
        point.y >= target.top - inset && point.y <= target.bottom + inset;
    }

    function dryHands(): void {
      if (dry.disabled) return;
      dry.disabled = true;
      dry.style.removeProperty("translate");
      sink.classList.remove("wash-drying");
      towel.src = washAsset("wash-towel-wet");
      hands.src = washAsset("hands-dry");
      el("instruction").textContent = "Kädet ovat kuivat. Nyt leivotaan!";
      timer = setTimeout(() => {
        washed = true;
        if (mixDough()) ingredients(recipe);
        else prepare(recipe);
      }, 600);
    }

    gesture(dry, {
      start(point) { towelOrigin = point; wiped = false; },
      move(from, point) {
        dry.style.translate = `${point.x - towelOrigin.x}px ${point.y - towelOrigin.y}px`;
        const over = overBasin(point);
        sink.classList.toggle("wash-drying", over);
        if (over && Math.hypot(point.x - from.x, point.y - from.y) > 3) wiped = true;
      },
      end(point) {
        dry.style.removeProperty("translate");
        sink.classList.remove("wash-drying");
        if (!point) return;
        if (wiped || overBasin(point)) dryHands();
        else if (Math.hypot(point.x - towelOrigin.x, point.y - towelOrigin.y) > 10)
          feedback("Vie pyyhe altaalla olevien käsien päälle.");
      },
    });
    dry.onclick = (event) => { if (event.detail === 0) dryHands(); };
  }

  function ingredients(recipe: Recipe): void {
    show(
      "Vedä jauhot, muna ja maito kulhoon.",
      `
      <div class="bakery-ingredients">
        <div class="bakery-flour" role="button" tabindex="0" aria-label="Lisää jauhot">${image("flour")}Jauhot</div>
        <div class="bakery-egg" role="button" tabindex="0" aria-label="Lisää muna">${image("egg")}Muna</div>
        <div class="bakery-milk" role="button" tabindex="0" aria-label="Lisää maito">${image("milk")}Maito</div>
      </div>
      <div class="bakery-bowl" aria-label="Sekoituskulho"></div>`,
    );
    const bowl = scene.querySelector<HTMLElement>(".bakery-bowl")!;
    bowl.style.setProperty("--bowl-art", `url("${recipeAsset("bowl")}")`);
    const items = [
      ...scene.querySelectorAll<HTMLElement>(".bakery-ingredients > div"),
    ];
    let added = 0;
    for (const item of items)
      transfer(item, bowl, () => {
        if (item.hidden) return;
        item.hidden = true;
        bowl.dataset.added = String(++added);
        const ingredient = item.querySelector("img");
        if (ingredient) {
          const marker = ingredient.cloneNode() as HTMLImageElement;
          marker.className = "bakery-ingredient-added";
          bowl.append(marker);
        }
        sound();
        if (added === items.length) mix(recipe);
      });
  }

  function mix(recipe: Recipe): void {
    show(
      "Sekoita taikina pyörittämällä sormea kulhossa.",
      `
      <div class="bakery-bowl mixing" role="button" tabindex="0" aria-label="Sekoita taikina"><span class="bakery-spoon" aria-hidden="true"></span></div>
      <progress class="bakery-progress" value="0" max="100" aria-label="Taikina sekoitettu"></progress>`,
    );
    const bowl = scene.querySelector<HTMLElement>(".bakery-bowl")!;
    bowl.style.setProperty("--bowl-art", `url("${recipeAsset("bowl")}")`);
    const spoon = scene.querySelector<HTMLElement>(".bakery-spoon")!;
    spoon.style.backgroundImage = `url("${recipeAsset("whisk")}")`;
    const meter = scene.querySelector<HTMLProgressElement>("progress")!;
    let mixedAngle = 0;
    let spoonPosition = { x: 0.5, y: 0.5 };
    const generation = mixingGeneration;
    void import("../phaser-room.js").then(({ createMixingView }) => {
      if (generation !== mixingGeneration || !bowl.isConnected) return;
      mixingView = createMixingView(bowl, recipeAsset("whisk"));
      mixingView.move(spoonPosition.x, spoonPosition.y, meter.value / 100);
    }).catch(() => {
      // The existing spoon remains available if the graphics cannot load.
    });
    function add(amount: number): void {
      mixedAngle += Math.abs(amount);
      meter.value = Math.min(100, (mixedAngle / (Math.PI * mixingGoal) + 1e-12) * 100);
      mixingView?.move(spoonPosition.x, spoonPosition.y, meter.value / 100);
      if (meter.value === 100) prepare(recipe);
    }
    gesture(bowl, {
      start() {},
      move(from, to) {
        const box = bowl.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        const radius = box.width / 2;
        spoonPosition = {
          x: (to.x - box.left) / box.width,
          y: (to.y - box.top) / box.height,
        };
        mixingView?.move(spoonPosition.x, spoonPosition.y, meter.value / 100);
        spoon.style.left =
          Math.max(15, Math.min(85, ((to.x - box.left) / box.width) * 100)) +
          "%";
        spoon.style.top =
          Math.max(15, Math.min(85, ((to.y - box.top) / box.height) * 100)) +
          "%";
        const distances = [from, to].map((point) =>
          Math.hypot(point.x - x, point.y - y),
        );
        if (
          distances.some(
            (distance) => distance < radius * 0.2 || distance > radius * 0.97,
          )
        )
          return;
        const delta =
          Math.atan2(to.y - y, to.x - x) - Math.atan2(from.y - y, from.x - x);
        const angle = Math.atan2(Math.sin(delta), Math.cos(delta));
        if (Math.abs(angle) < Math.PI / 2) add(angle);
      },
      end() {},
    });
    bowl.addEventListener("keydown", (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      add(Math.PI);
    });
  }

  function tray(recipe: Recipe): void {
    show(
      "Vedä leivinpaperi pellille.",
      `
      <div class="bakery-tray" aria-label="Uunipelti"><div class="bakery-slots"></div></div>
      <div class="bakery-paper" tabindex="0" role="button" aria-label="Aseta leivinpaperi pellille"></div>
      <div class="bakery-dough" hidden></div>`,
    );
    const pan = scene.querySelector<HTMLElement>(".bakery-tray")!;
    const paper = scene.querySelector<HTMLElement>(".bakery-paper")!;
    const slots = scene.querySelector<HTMLElement>(".bakery-slots")!;
    const dough = scene.querySelector<HTMLElement>(".bakery-dough")!;
    pan.style.setProperty("--bakery-art", `url("${recipeAsset("tray")}")`);
    paper.style.setProperty("--bakery-art", `url("${recipeAsset("paper")}")`);
    const generation = mixingGeneration;
    void import("../phaser-room.js").then(({ createBakingTrayView }) => {
      if (generation !== mixingGeneration || !pan.isConnected) return;
      trayView = createBakingTrayView(pan, recipeAsset(recipe.raw), recipeAsset("paper"));
      if (pan.classList.contains("lined")) trayView.line();
      [...slots.children].forEach((slot, index) => {
        if (slot.hasChildNodes()) trayView?.place(index);
      });
    }).catch(() => {
      // The existing tray remains available if the graphics cannot load.
    });
    transfer(paper, pan, () => {
      if (paper.hidden) return;
      paper.hidden = true;
      pan.classList.add("lined");
      trayView?.line();
      el("instruction").textContent =
        "Siirrä leivonnaiset vapaisiin paikkoihin pellille.";
      dough.hidden = false;
      for (let i = 0; i < portionCount; i++) {
        slots.insertAdjacentHTML(
          "beforeend",
          '<span class="bakery-slot"></span>',
        );
        dough.insertAdjacentHTML(
          "beforeend",
          '<div role="button" tabindex="0" aria-label="Siirrä ' +
            recipe.piece +
            ' pellille">' +
            piece(recipe) +
            "</div>",
        );
      }
      const places = [...slots.children] as HTMLElement[];
      let filled = 0;
      for (const item of [...dough.children] as HTMLElement[])
        transfer(item, pan, (point) => {
          if (item.hidden) return;
          const open = places.filter((slot) => !slot.hasChildNodes());
          const chosen = point
            ? open.reduce((best, slot) => {
                const distance = (el: HTMLElement) => {
                  const rect = el.getBoundingClientRect();
                  return Math.hypot(
                    rect.left + rect.width / 2 - point.x,
                    rect.top + rect.height / 2 - point.y,
                  );
                };
                return distance(slot) < distance(best) ? slot : best;
              })
            : open[0];
          chosen.innerHTML = piece(recipe);
          trayView?.place(places.indexOf(chosen));
          item.hidden = true;
          sound();
          if (++filled === places.length) {
            if (selectedRecipe === "bun" && decorate()) proof(recipe);
            else oven(recipe);
          }
        });
    });
  }

  function proof(recipe: Recipe): void {
    show("Korvapuustit kohoavat.", image("bun-proofed"));
    timer = setTimeout(() => oven(recipe), 1000);
  }

  function complete(recipe: Recipe): void {
    stopMixingView();
    progress(total, total);
    const last = recipe.decorations.find(({ name }) => name === toppings.at(-1));
    const result = selectedRecipe === "tart" && toppings.length > 1 ? "tart-mixed"
      : selectedRecipe === "tart" && toppings[0] === "Mansikka" ? "tart-slice"
        : last?.image ?? recipe.ready;
    const text = toppings.length ? `Valitsit: ${toppings.join(", ").toLowerCase()}. Hile kiittää avusta.` : "Hile kiittää avusta.";
    finish("Pelti on valmis!", text, "cakey", {
      src: recipeAsset(result),
      alt: recipe.name,
      details: toppings.flatMap((name) => {
        const choice = recipe.decorations.find((decoration) => decoration.name === name);
        return choice ? [{
          src: recipeAsset(selectedRecipe === "tart" && "tool" in choice && typeof choice.tool === "string" ? choice.tool : choice.image),
          alt: name,
        }] : [];
      }),
    });
  }

  function finishRecipe(recipe: Recipe): void {
    runSteps(selectedRecipe === "tart" || decorate() ? recipe.after : [], () => {
      if (!decorate()) {
        complete(recipe);
        return;
      }
      const count = order?.toppings ?? (selectedRecipe === "tart" ? 1 : portionCount);
      show("Vedä koriste leivonnaisen päälle.", `
        <div class="bakery-work-target" aria-label="Leivonnainen">${image(recipe.ready)}</div>
        <div class="bakery-decorations"></div>
        <p class="bakery-decoration-status" aria-live="polite">0 / ${count}</p>
        <div class="bakery-step-results" aria-hidden="true"></div>`);
      const destination = scene.querySelector<HTMLElement>(".bakery-work-target")!;
      const artwork = destination.querySelector("img")!;
      const status = scene.querySelector<HTMLElement>(".bakery-decoration-status")!;
      const options = scene.querySelector<HTMLElement>(".bakery-decorations")!;
      const requested = order?.requested;
      const results = scene.querySelector<HTMLElement>(".bakery-step-results")!;
      for (const decoration of recipe.decorations) {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("aria-label", decoration.name);
        button.innerHTML = image("tool" in decoration ? decoration.tool : decoration.image);
        transfer(button, destination, () => {
          if (button.disabled) return;
          if (requested && toppings.length === 0 && decoration.name !== requested) {
            feedback(`Hile toivoo ensimmäiseen kakkuun: ${requested.toLowerCase()}.`);
            return;
          }
          toppings.push(decoration.name);
          if (selectedRecipe !== "tart") results.insertAdjacentHTML("beforeend", image(decoration.image));
          artwork.src = recipeAsset(selectedRecipe === "tart" && toppings.length > 1 ? "tart-mixed" : decoration.image);
          status.textContent = `${toppings.length} / ${count}`;
          if (toppings.length === count) {
            if (selectedRecipe === "tart" && toppings.every((name) => name === "Mansikka")) artwork.src = recipeAsset("tart-slice");
            options.querySelectorAll("button").forEach((choice) => { choice.disabled = true; });
            timer = setTimeout(() => complete(recipe), 650);
          } else if (selectedRecipe === "tart") button.disabled = true;
        });
        options.append(button);
      }
      if (requested) feedback(`Hileen ensimmäinen toive: ${requested.toLowerCase()}.`);
      options.querySelector("button")?.focus({ preventScroll: true });
    });
  }

  function oven(recipe: Recipe): void {
    show(
      "Vedä uunin luukkua alaspäin.",
      `
      <div class="bakery-oven">
        <div class="bakery-knob" role="slider" tabindex="0" aria-label="Uunin lämpötila" aria-valuemin="0" aria-valuemax="225" aria-valuenow="0" aria-disabled="true"></div>
        <output class="bakery-temp">0 °C</output>
        <div class="bakery-cavity">
          <div class="bakery-door" role="button" tabindex="0" aria-label="Avaa uunin luukku"></div>
        </div>
      </div>
      <div class="oven-tray oven-transfer" tabindex="0" role="button" aria-label="Siirrä pelti uuniin" hidden>${"<span></span>".repeat(portionCount)}</div>`,
    );
    const cavity = scene.querySelector<HTMLElement>(".bakery-cavity")!;
    const door = scene.querySelector<HTMLElement>(".bakery-door")!;
    const knob = scene.querySelector<HTMLElement>(".bakery-knob")!;
    const temperature = scene.querySelector<HTMLOutputElement>(".bakery-temp")!;
    const pan = scene.querySelector<HTMLElement>(".oven-tray")!;

    let step = 0;
    let start: Point;
    let heat = 0;
    let dial = 0;
    function toggleDoor(): void {
      if (step === 0) {
        step = 1;
        cavity.classList.add("door-open");
        pan.hidden = false;
        door.setAttribute("aria-label", "Uunin luukku on auki");
        el("instruction").textContent = "Vedä täysi pelti uuniin.";
      } else if (step === 2) {
        step = 3;
        cavity.classList.remove("door-open");
        door.setAttribute("aria-label", "Uunin luukku on kiinni");
        knob.setAttribute("aria-disabled", "false");
        el("instruction").textContent =
          "Käännä nuppia, kunnes uuni on " + recipe.heat + " °C.";
      }
    }
    gesture(door, {
      start(point) {
        start = point;
      },
      move(_from, point) {
        if (step !== 0 && step !== 2) return;
        const base = step === 2 ? 1 : 0;
        const opening = Math.max(0, Math.min(1, base + (point.y - start.y) / 53));
        door.style.setProperty("--door-scale", String(1 - 0.78 * opening));
      },
      end(point) {
        door.style.removeProperty("--door-scale");
        if (
          point &&
          ((step === 0 && point.y - start.y > 25) ||
            (step === 2 && start.y - point.y > 25))
        )
          toggleDoor();
      },
    });
    door.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleDoor();
      }
    };
    transfer(pan, cavity, () => {
      if (step !== 1) return;
      step = 2;
      pan.hidden = true;
      cavity.classList.add("tray-loaded");
      const loaded = document.createElement("div");
      loaded.className = "bakery-loaded";
      loaded.setAttribute("aria-hidden", "true");
      loaded.classList.add("oven-transfer");
      loaded.innerHTML = "<span></span>".repeat(portionCount);
      cavity.prepend(loaded);
      door.setAttribute("aria-label", "Sulje uunin luukku");
      el("instruction").textContent = "Vedä luukku ylös kiinni.";
      sound();
    });
    function setHeat(value: number): void {
      if (step !== 3) return;
      heat = Math.max(0, Math.min(recipe.heat, value));
      knob.style.setProperty("--dial", (-135 + (heat / 225) * 270) + "deg");
      knob.setAttribute("aria-valuenow", String(Math.round(heat)));
      temperature.value = Math.round(heat) + " °C";
      if (heat < recipe.heat) return;
      step = 4;
      knob.setAttribute("aria-disabled", "true");
      cavity.classList.add("oven-cooking");
      feedback("Leivonnaiset paistuvat.");
      timer = setTimeout(() => {
        finishRecipe(recipe);
      }, 1700);
    }
    gesture(knob, {
      start(point) {
        dial = point.x;
      },
      move(_from, to) {
        setHeat(heat + Math.abs(to.x - dial) * 1.6);
        dial = to.x;
      },
      end() {},
    });
    knob.onkeydown = (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        setHeat(heat + 25);
      }
    };
  }
}

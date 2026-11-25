import { bakeryFrames } from "./baking-atlas-frames.js";
import { campaignLevel } from "../campaign.js";
import { ding, say, unlock } from "../audio.js";
import { el } from "../dom.js";
import { feedback, finish, heading, progress, } from "../ui.js";
import { bindStroke, stopStroke } from "./stroke.js";
import { orders, recipes, bakeryAsset } from "./baking-recipes.js";
let washed = false;
export function resetBakingVisit() {
    washed = false;
}
let timer;
let mixingView;
let trayView;
let mixingGeneration = 0;
function stopMixingView() {
    mixingGeneration++;
    mixingView?.destroy();
    mixingView = undefined;
    trayView?.destroy();
    trayView = undefined;
}
export function stopBakingGestures() {
    stopMixingView();
    clearTimeout(timer);
    el("baking")
        .querySelectorAll("[data-gesture]")
        .forEach(stopStroke);
    el("baking").replaceChildren();
}
const stepMotion = {
    roll: [{ scale: "1" }, { scale: "1.12 .9" }, { scale: "1" }],
    press: [{ scale: "1" }, { scale: "1.06 .88" }, { scale: "1" }],
    pour: [{ scale: ".84", translate: "0 -8%" }, { scale: "1", translate: "0 0" }],
    place: [{ scale: ".8", translate: "0 -16%" }, { scale: "1", translate: "0 0" }],
    spread: [{ scale: ".88 1" }, { scale: "1.09 .97" }, { scale: "1" }],
    slice: [{ translate: "0" }, { translate: "5%" }, { translate: "0" }],
};
export function startBaking() {
    stopBakingGestures();
    const game = el("baking");
    const adventure = campaignLevel();
    const order = adventure === undefined ? undefined : orders[adventure - 1];
    let portionCount = order?.count ?? 6;
    let selectedRecipe;
    let washEnabled = true;
    let mixEnabled = true;
    let decorationsEnabled = true;
    const mixDough = () => order?.mix ?? mixEnabled;
    let stage = 0;
    let total = 1;
    const toppings = [];
    const mixingGoal = adventure === undefined ? 4 : [2, 2, 3, 3, 3, 4, 4, 4, 5, 5][adventure - 1];
    heading("cakey", "Hileen leipomo", "Valitse mitä haluat leipoa.", "Hileen keittiö");
    const scene = document.createElement("div");
    scene.className = "bakery-scene";
    game.append(scene);
    progress(0, total);
    function show(instruction, html) {
        stopMixingView();
        scene.querySelectorAll("[data-gesture]").forEach(stopStroke);
        scene.innerHTML = html;
        feedback("");
        el("instruction").textContent = instruction;
        progress(stage++, total);
        const first = scene.querySelector("button:not(:disabled), [tabindex='0']");
        first?.focus({ preventScroll: true });
    }
    function sound() {
        unlock();
        ding("piece");
    }
    function gesture(target, handlers) {
        target.dataset.gesture = "";
        bindStroke(target, handlers);
    }
    function transfer(item, destination, accept) {
        let start;
        let misses = 0;
        let dragged = false;
        item.addEventListener("click", (event) => {
            if (dragged && event.detail > 0)
                event.stopImmediatePropagation();
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
                if (point.x >= box.left - 12 &&
                    point.x <= box.right + 12 &&
                    point.y >= box.top - 12 &&
                    point.y <= box.bottom + 12)
                    accept(point);
                else {
                    feedback(misses ? "Kokeile korostettua kohdetta." : "Vie väline työpinnalle tai ohjeessa näkyvään kohteeseen.");
                    if (++misses >= 2)
                        destination.classList.add("bakery-drop-hint");
                }
            },
        });
        if (item instanceof HTMLButtonElement) {
            item.onclick = (event) => { if (event.detail === 0)
                accept(); };
            return;
        }
        item.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ")
                return;
            event.preventDefault();
            accept();
        });
    }
    const recipeAsset = (asset) => new URL(bakeryAsset(selectedRecipe, asset), document.baseURI).href;
    const atlas = (set) => bakeryAsset(set, "atlas");
    const phaserAtlas = () => {
        const texture = new URL(atlas(selectedRecipe), document.baseURI).href;
        return { texture, data: texture.replace(/\.webp$/, ".json") };
    };
    const stretchedArt = new Set([
        "wash-tiles", "wash-counter", "wash-basin", "wash-stream",
        "wash-base", "wash-head", "oven-body-art", "oven-rack-art", "bakery-tray-art",
    ]);
    const image = (asset, set = selectedRecipe, className = "") => {
        const { width, height, frames } = bakeryFrames[set];
        const box = frames[asset];
        const size = box.split(" ").slice(2).join(" ");
        const fit = stretchedArt.has(className) || set === "oven" && asset !== "temperature_knob"
            ? "none" : "xMidYMid meet";
        // The inner viewport clips to the frame even if the outer one letterboxes.
        return `<svg class="bakery-texture ${className}" data-frame="${asset}" viewBox="0 0 ${size}" preserveAspectRatio="${fit}" aria-hidden="true" focusable="false">
      <svg width="100%" height="100%" viewBox="${box}" overflow="hidden">
        <image href="${atlas(set)}" width="${width}" height="${height}"/>
      </svg>
    </svg>`;
    };
    function showFrame(texture, asset, set = selectedRecipe) {
        const box = bakeryFrames[set].frames[asset];
        texture.dataset.frame = asset;
        texture.setAttribute("viewBox", `0 0 ${box.split(" ").slice(2).join(" ")}`);
        texture.querySelector("svg").setAttribute("viewBox", box);
    }
    const piece = (recipe) => `<span class="bakery-piece">${image(recipe.raw)}</span>`;
    const decorate = () => order ? selectedRecipe === "tart" || order.finish : decorationsEnabled;
    const usesParchment = () => selectedRecipe === "cookie" || selectedRecipe === "bun";
    function prepare(recipe) {
        runSteps(recipe.prepare, () => {
            if (usesParchment())
                tray(recipe);
            else
                oven(recipe);
        });
    }
    function begin(id) {
        selectedRecipe = id;
        const recipe = recipes[id];
        if (id === "tart")
            portionCount = 1;
        else if (!order) {
            const quantity = scene.querySelector("#gf-baking-quantity").value;
            portionCount = quantity === "recipe" ? (id === "bun" ? 4 : 6) : Number(quantity);
        }
        const shouldWash = order ? !washed || adventure === 1 : washEnabled;
        total = 1 + Number(usesParchment()) + recipe.prepare.length + (shouldWash ? 1 : 0) +
            (mixDough() ? 2 : 0) +
            (id === "bun" && decorate() ? 1 : 0) +
            (id === "tart" || decorate() ? recipe.after.length : 0) + (decorate() ? 1 : 0) +
            (order ? 1 : 0);
        const cook = () => {
            if (shouldWash)
                wash(recipe);
            else if (mixDough())
                ingredients(recipe);
            else
                prepare(recipe);
        };
        if (order) {
            show(`Hileen tilaus · ${recipe.name} · ${portionCount} kpl`, `<div class="bakery-order-stand" aria-label="Tilausteline">Tilausteline</div>
          <button type="button" class="bakery-order-card" aria-label="Aloita tilaus">${image(recipe.ready)}${recipe.name}</button>
          ${order.requested ? `<p>Hileen toive: ${order.requested.toLowerCase()}.</p>` : ""}`);
            el("instruction").textContent += ". Vedä reseptikortti telineeseen.";
            transfer(scene.querySelector(".bakery-order-card"), scene.querySelector(".bakery-order-stand"), cook);
        }
        else
            cook();
    }
    if (order?.recipe) {
        begin(order.recipe);
        return;
    }
    if (order)
        el("instruction").textContent = "Hileen juhlatilaus: valitse yksi resepti.";
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
    <div class="bakery-recipes">${Object.keys(recipes).map((id) => `<button type="button" class="bakery-recipe" data-recipe="${id}">${image(recipes[id].ready, id)}${recipes[id].name}</button>`).join("")}</div>`;
    scene.querySelectorAll(".bakery-recipe")
        .forEach((choice) => {
        choice.onclick = () => {
            if (!order) {
                washEnabled = scene.querySelector("#gf-baking-wash").checked;
                mixEnabled = scene.querySelector("#gf-baking-mix").checked;
                decorationsEnabled = scene.querySelector("#gf-baking-decorate").checked;
            }
            begin(choice.dataset.recipe);
        };
    });
    function runSteps(steps, done) {
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
        const target = scene.querySelector(".bakery-work-target");
        const action = scene.querySelector(".bakery-step-action");
        const workArt = target.querySelector("svg");
        const meter = scene.querySelector(".bakery-step-count");
        const results = scene.querySelector(".bakery-step-results");
        let completed = 0;
        meter.textContent = `0 / ${count}`;
        function work() {
            if (completed === count)
                return;
            completed++;
            sound();
            meter.textContent = `${completed} / ${count}`;
            if (step.result) {
                if (count === 1)
                    showFrame(workArt, step.result);
                else
                    results.insertAdjacentHTML("beforeend", image(step.result));
            }
            if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
                const changed = count === 1 ? workArt : results.lastElementChild;
                changed?.getAnimations().forEach((animation) => animation.cancel());
                changed?.animate(stepMotion[step.motion], { duration: 260, easing: "ease-out" });
            }
            if (completed === count) {
                action.disabled = true;
                timer = setTimeout(() => runSteps(remaining, done), 450);
            }
        }
        if (step.tool)
            transfer(action, target, work);
        else {
            action.hidden = true;
            target.tabIndex = 0;
            target.setAttribute("role", "button");
            target.setAttribute("aria-label", step.action);
            target.onkeydown = (event) => {
                if (event.key !== "Enter" && event.key !== " ")
                    return;
                event.preventDefault();
                work();
            };
            target.focus({ preventScroll: true });
            let start;
            gesture(target, {
                start(point) { start = point; },
                move(_previous, point) { target.style.setProperty("--work-offset", `${(point.x - start.x) / 4}px`); },
                end(point) {
                    target.style.removeProperty("--work-offset");
                    if (point && Math.hypot(point.x - start.x, point.y - start.y) >= 16)
                        work();
                },
            });
        }
        action.onclick = (event) => { if (event.detail === 0)
            work(); };
    }
    function wash(recipe) {
        show("Käännä hanan vipua sivulle avataksesi veden.", `
      <div class="baking-wash">
        ${image("wash-tiles", "wash", "wash-tiles")}
        ${image("wash-counter", "wash", "wash-counter")}
        ${image("wash-spout", "wash", "wash-spout")}
        ${image("wash-water", "wash", "wash-stream")}
        <button type="button" class="wash-soap wash-object" aria-label="Ota saippuaa" disabled>
          ${image("wash-pump-head", "wash", "wash-head")}
          ${image("wash-pump-base", "wash", "wash-base")}
        </button>
        <button type="button" class="wash-tap wash-object" aria-label="Avaa hana">
          ${image("wash-lever-base", "wash", "wash-base")}
          ${image("wash-lever-head", "wash", "wash-head")}
        </button>
        <div class="wash-hands">${image("sink", "wash", "wash-basin")}
          <button type="button" class="wash-scrub" aria-label="Pese kädet" disabled>
            ${image("hands-clean", "wash", "wash-state")}
          </button>
          ${image("rinse-splash", "wash", "wash-splash")}
          ${image("soap-foam", "wash", "wash-foam")}
        </div>
        <button type="button" class="wash-dry wash-object" aria-label="Kuivaa kädet" hidden>${image("towel", "wash")}</button>
      </div>`);
        say("Hei pieni ystävä! Leikitään yhdessä.");
        const soap = scene.querySelector(".wash-soap");
        const tap = scene.querySelector(".wash-tap");
        const sink = scene.querySelector(".baking-wash");
        const hands = scene.querySelector(".wash-state");
        const scrub = scene.querySelector(".wash-scrub");
        const dry = scene.querySelector(".wash-dry");
        let waterOn = false;
        let handPose = "";
        function pose(asset) {
            if (handPose === asset)
                return;
            handPose = asset;
            showFrame(hands, asset, "wash");
        }
        const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
        function handle(object, measure, act) {
            let origin;
            let distance = 0;
            gesture(object, {
                start(point) { origin = point; distance = 0; },
                move(from, point) {
                    distance += Math.abs(point.x - from.x);
                    const movement = Math.max(0, Math.min(1, measure(origin, point, distance)));
                    object.style.setProperty("--wash-motion", String(movement));
                    if (object === scrub && !reducedMotion)
                        pose(point.x < from.x ? "hands-scrub-left" : "hands-scrub-right");
                },
                end(point) {
                    object.style.removeProperty("--wash-motion");
                    if (point && !object.disabled && measure(origin, point, distance) >= 1)
                        act();
                    else if (object === scrub)
                        pose("hands-soapy");
                },
            });
            object.onclick = (event) => {
                if (event.detail === 0 && !object.disabled)
                    act();
            };
        }
        handle(soap, (start, point) => (point.y - start.y) / 14, () => {
            pose("hands-soapy");
            sink.classList.remove("rinsing", "wash-water-on");
            sink.classList.add("soap-dispensing");
            if (!reducedMotion)
                soap.querySelector("svg").animate([{ translate: "0 0" }, { translate: "0 17%" }, { translate: "0 0" }], { duration: 280 });
            sound();
            sink.classList.add("soapy");
            soap.disabled = true;
            scrub.disabled = false;
            scrub.focus({ preventScroll: true });
            el("instruction").textContent = "Hankaa käsiä edestakaisin.";
        });
        handle(scrub, (start, point, distance) => Math.max(distance, Math.abs(point.x - start.x)) / 24, () => {
            scrub.disabled = true;
            if (!reducedMotion) {
                pose("hands-scrub-left");
                timer = setTimeout(() => {
                    if (!tap.disabled)
                        pose("hands-scrub-right");
                }, 125);
            }
            tap.setAttribute("aria-label", "Huuhtele kädet");
            tap.disabled = false;
            tap.focus({ preventScroll: true });
            el("instruction").textContent = "Käännä hanaa huuhdellaksesi kädet.";
        });
        handle(tap, (start, point) => Math.abs(point.x - start.x) / 18, () => {
            if (!waterOn) {
                waterOn = true;
                sink.classList.add("wash-water-on");
                tap.disabled = true;
                soap.disabled = false;
                soap.focus({ preventScroll: true });
                el("instruction").textContent = "Paina saippuapumppua alaspäin.";
                return;
            }
            tap.disabled = true;
            sink.classList.add("rinsing", "wash-water-on");
            pose("hands-rinse");
            clearTimeout(timer);
            timer = setTimeout(() => {
                sink.classList.remove("rinsing", "soapy", "wash-water-on");
                pose("hands-wet");
                dry.hidden = false;
                el("instruction").textContent = "Vedä pyyhe käsien päälle.";
                dry.focus({ preventScroll: true });
            }, 650);
        });
        const towel = dry.querySelector("svg");
        let towelOrigin;
        let wiped = false;
        function overBasin(point) {
            const target = scrub.parentElement.getBoundingClientRect();
            const inset = 14;
            return point.x >= target.left - inset && point.x <= target.right + inset &&
                point.y >= target.top - inset && point.y <= target.bottom + inset;
        }
        function dryHands() {
            if (dry.disabled)
                return;
            dry.disabled = true;
            dry.style.removeProperty("translate");
            sink.classList.remove("wash-drying");
            showFrame(towel, "wash-towel-wet", "wash");
            pose("hands-dry");
            sink.classList.add("wash-dried");
            el("instruction").textContent = "Kädet ovat kuivat. Nyt leivotaan!";
            timer = setTimeout(() => {
                washed = true;
                if (mixDough())
                    ingredients(recipe);
                else
                    prepare(recipe);
            }, 600);
        }
        gesture(dry, {
            start(point) { towelOrigin = point; wiped = false; },
            move(from, point) {
                dry.style.translate = `${point.x - towelOrigin.x}px ${point.y - towelOrigin.y}px`;
                const over = overBasin(point);
                sink.classList.toggle("wash-drying", over);
                if (over && Math.hypot(point.x - from.x, point.y - from.y) > 3)
                    wiped = true;
            },
            end(point) {
                dry.style.removeProperty("translate");
                sink.classList.remove("wash-drying");
                if (!point)
                    return;
                if (wiped || overBasin(point))
                    dryHands();
                else if (Math.hypot(point.x - towelOrigin.x, point.y - towelOrigin.y) > 10)
                    feedback("Vie pyyhe altaalla olevien käsien päälle.");
            },
        });
        dry.onclick = (event) => { if (event.detail === 0)
            dryHands(); };
    }
    function ingredients(recipe) {
        show("Vedä jauhot, muna ja maito kulhoon.", `
      <div class="bakery-ingredients">
        <div class="bakery-flour" role="button" tabindex="0" aria-label="Lisää jauhot">${image("flour")}Jauhot</div>
        <div class="bakery-egg" role="button" tabindex="0" aria-label="Lisää muna">${image("egg")}Muna</div>
        <div class="bakery-milk" role="button" tabindex="0" aria-label="Lisää maito">${image("milk")}Maito</div>
      </div>
      <div class="bakery-bowl" aria-label="Sekoituskulho">${image("bowl", selectedRecipe, "bakery-bowl-art")}</div>`);
        const bowl = scene.querySelector(".bakery-bowl");
        const items = [
            ...scene.querySelectorAll(".bakery-ingredients > div"),
        ];
        let added = 0;
        for (const item of items)
            transfer(item, bowl, () => {
                if (item.hidden)
                    return;
                item.hidden = true;
                bowl.dataset.added = String(++added);
                const ingredient = item.querySelector("svg");
                if (ingredient) {
                    const marker = ingredient.cloneNode(true);
                    marker.setAttribute("class", "bakery-texture bakery-ingredient-added bakery-new-result");
                    bowl.append(marker);
                }
                sound();
                if (added === items.length)
                    mix(recipe);
            });
    }
    function mix(recipe) {
        show("Sekoita taikina pyörittämällä sormea kulhossa.", `
      <div class="bakery-bowl mixing" role="button" tabindex="0" aria-label="Sekoita taikina">${image("bowl", selectedRecipe, "bakery-bowl-art")}${image("whisk", selectedRecipe, "bakery-spoon")}</div>
      <progress class="bakery-progress" value="0" max="100" aria-label="Taikina sekoitettu"></progress>`);
        const bowl = scene.querySelector(".bakery-bowl");
        const spoon = scene.querySelector(".bakery-spoon");
        const meter = scene.querySelector("progress");
        let mixedAngle = 0;
        let spoonPosition = { x: 0.5, y: 0.5 };
        const generation = mixingGeneration;
        void import("../phaser-room.js").then(({ createMixingView }) => {
            if (generation !== mixingGeneration || !bowl.isConnected)
                return;
            mixingView = createMixingView(bowl, phaserAtlas());
            mixingView.move(spoonPosition.x, spoonPosition.y, meter.value / 100);
        }).catch(() => {
            // The existing spoon remains available if the graphics cannot load.
        });
        function add(amount) {
            mixedAngle += Math.abs(amount);
            meter.value = Math.min(100, (mixedAngle / (Math.PI * mixingGoal) + 1e-12) * 100);
            mixingView?.move(spoonPosition.x, spoonPosition.y, meter.value / 100);
            if (meter.value === 100)
                prepare(recipe);
        }
        gesture(bowl, {
            start() { },
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
                const distances = [from, to].map((point) => Math.hypot(point.x - x, point.y - y));
                if (distances.some((distance) => distance < radius * 0.2 || distance > radius * 0.97))
                    return;
                const delta = Math.atan2(to.y - y, to.x - x) - Math.atan2(from.y - y, from.x - x);
                const angle = Math.atan2(Math.sin(delta), Math.cos(delta));
                if (Math.abs(angle) < Math.PI / 2)
                    add(angle);
            },
            end() { },
        });
        bowl.addEventListener("keydown", (event) => {
            if (event.key !== " " && event.key !== "Enter")
                return;
            event.preventDefault();
            add(Math.PI);
        });
    }
    function tray(recipe) {
        show("Vedä leivinpaperi pellille.", `
      <div class="bakery-tray" aria-label="Uunipelti">${image("tray", selectedRecipe, "bakery-tray-art")}<div class="bakery-slots"></div></div>
      <div class="bakery-paper" tabindex="0" role="button" aria-label="Aseta leivinpaperi pellille">${image("paper")}</div>
      <div class="bakery-dough" hidden></div>`);
        const pan = scene.querySelector(".bakery-tray");
        const paper = scene.querySelector(".bakery-paper");
        const slots = scene.querySelector(".bakery-slots");
        const dough = scene.querySelector(".bakery-dough");
        const generation = mixingGeneration;
        void import("../phaser-room.js").then(({ createBakingTrayView }) => {
            if (generation !== mixingGeneration || !pan.isConnected)
                return;
            trayView = createBakingTrayView(pan, phaserAtlas(), recipe.raw);
            if (pan.classList.contains("lined"))
                trayView.line();
            [...slots.children].forEach((slot, index) => {
                if (slot.hasChildNodes())
                    trayView?.place(index);
            });
        }).catch(() => {
            // The existing tray remains available if the graphics cannot load.
        });
        transfer(paper, pan, () => {
            if (paper.hidden)
                return;
            paper.hidden = true;
            pan.classList.add("lined");
            trayView?.line();
            el("instruction").textContent =
                "Siirrä leivonnaiset vapaisiin paikkoihin pellille.";
            dough.hidden = false;
            for (let i = 0; i < portionCount; i++) {
                slots.insertAdjacentHTML("beforeend", '<span class="bakery-slot"></span>');
                dough.insertAdjacentHTML("beforeend", '<div role="button" tabindex="0" aria-label="Siirrä ' +
                    recipe.piece +
                    ' pellille">' +
                    piece(recipe) +
                    "</div>");
            }
            const places = [...slots.children];
            let filled = 0;
            for (const item of [...dough.children])
                transfer(item, pan, (point) => {
                    if (item.hidden)
                        return;
                    const open = places.filter((slot) => !slot.hasChildNodes());
                    const chosen = point
                        ? open.reduce((best, slot) => {
                            const distance = (el) => {
                                const rect = el.getBoundingClientRect();
                                return Math.hypot(rect.left + rect.width / 2 - point.x, rect.top + rect.height / 2 - point.y);
                            };
                            return distance(slot) < distance(best) ? slot : best;
                        })
                        : open[0];
                    chosen.innerHTML = piece(recipe);
                    trayView?.place(places.indexOf(chosen));
                    item.hidden = true;
                    sound();
                    if (++filled === places.length) {
                        if (selectedRecipe === "bun" && decorate())
                            proof(recipe);
                        else
                            oven(recipe);
                    }
                });
        });
    }
    function proof(recipe) {
        show("Korvapuustit kohoavat.", `
      <div class="bakery-proof-stage">
        ${image(recipe.raw, selectedRecipe, "bakery-proof-raw")}
        ${image("bun-proofed", selectedRecipe, "bakery-proof")}
      </div>`);
        timer = setTimeout(() => oven(recipe), 1000);
    }
    function complete(recipe) {
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
    function finishRecipe(recipe) {
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
            const destination = scene.querySelector(".bakery-work-target");
            const artwork = destination.querySelector("svg");
            const status = scene.querySelector(".bakery-decoration-status");
            const options = scene.querySelector(".bakery-decorations");
            const requested = order?.requested;
            const results = scene.querySelector(".bakery-step-results");
            for (const decoration of recipe.decorations) {
                const button = document.createElement("button");
                button.type = "button";
                button.setAttribute("aria-label", decoration.name);
                button.innerHTML = image("tool" in decoration ? decoration.tool : decoration.image);
                transfer(button, destination, () => {
                    if (button.disabled)
                        return;
                    if (requested && toppings.length === 0 && decoration.name !== requested) {
                        feedback(`Hile toivoo ensimmäiseen kakkuun: ${requested.toLowerCase()}.`);
                        return;
                    }
                    toppings.push(decoration.name);
                    if (selectedRecipe !== "tart")
                        results.insertAdjacentHTML("beforeend", image(decoration.image, selectedRecipe, "bakery-new-result"));
                    showFrame(artwork, selectedRecipe === "tart" && toppings.length > 1 ? "tart-mixed" : decoration.image);
                    if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
                        artwork.animate([{ scale: ".94" }, { scale: "1.04" }, { scale: "1" }], 260);
                    status.textContent = `${toppings.length} / ${count}`;
                    if (toppings.length === count) {
                        if (selectedRecipe === "tart" && toppings.every((name) => name === "Mansikka"))
                            showFrame(artwork, "tart-slice");
                        options.querySelectorAll("button").forEach((choice) => { choice.disabled = true; });
                        timer = setTimeout(() => complete(recipe), 650);
                    }
                    else if (selectedRecipe === "tart")
                        button.disabled = true;
                });
                options.append(button);
            }
            if (requested)
                feedback(`Hileen ensimmäinen toive: ${requested.toLowerCase()}.`);
            options.querySelector("button")?.focus({ preventScroll: true });
        });
    }
    function oven(recipe) {
        show("Vedä uunin luukkua alaspäin.", `
      <div class="bakery-oven">
        ${image("oven_body", "oven", "oven-body-art")}
        <div class="bakery-knob" role="slider" tabindex="0" aria-label="Uunin lämpötila" aria-valuemin="0" aria-valuemax="225" aria-valuenow="0" aria-disabled="true">${image("temperature_knob", "oven")}</div>
        <output class="bakery-temp">0 °C</output>
        <div class="bakery-cavity">
          ${image("oven_rack", "oven", "oven-rack-art")}
          <div class="bakery-door" role="button" tabindex="0" aria-label="Avaa uunin luukku">
            ${image("oven_glass", "oven")}${image("oven_door_frame", "oven")}${image("oven_handle", "oven")}
          </div>
        </div>
      </div>
      <div class="oven-tray oven-transfer" tabindex="0" role="button" aria-label="Siirrä pelti uuniin" hidden>${"<span></span>".repeat(portionCount)}</div>`);
        const cavity = scene.querySelector(".bakery-cavity");
        const door = scene.querySelector(".bakery-door");
        const knob = scene.querySelector(".bakery-knob");
        const temperature = scene.querySelector(".bakery-temp");
        const pan = scene.querySelector(".oven-tray");
        let step = 0;
        let start;
        let heat = 0;
        let dial = 0;
        function toggleDoor() {
            if (step === 0) {
                step = 1;
                cavity.classList.add("door-open");
                pan.hidden = false;
                door.setAttribute("aria-label", "Uunin luukku on auki");
                el("instruction").textContent = "Vedä täysi pelti uuniin.";
            }
            else if (step === 2) {
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
                if (step !== 0 && step !== 2)
                    return;
                const base = step === 2 ? 1 : 0;
                const opening = Math.max(0, Math.min(1, base + (point.y - start.y) / 53));
                door.style.setProperty("--door-angle", `${-76 * opening}deg`);
            },
            end(point) {
                door.style.removeProperty("--door-angle");
                if (point &&
                    ((step === 0 && point.y - start.y > 25) ||
                        (step === 2 && start.y - point.y > 25)))
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
            if (step !== 1)
                return;
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
        function setHeat(value) {
            if (step !== 3)
                return;
            heat = Math.max(0, Math.min(recipe.heat, value));
            knob.style.setProperty("--dial", (-135 + (heat / 225) * 270) + "deg");
            knob.setAttribute("aria-valuenow", String(Math.round(heat)));
            temperature.value = Math.round(heat) + " °C";
            if (heat < recipe.heat)
                return;
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
            end() { },
        });
        knob.onkeydown = (event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                setHeat(heat + 25);
            }
        };
    }
}

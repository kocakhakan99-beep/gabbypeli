import { campaignLevel } from "../campaign.js";
import { ding, say, unlock } from "../audio.js";
import { el } from "../dom.js";
import { feedback, finish, heading, progress, } from "../ui.js";
import { bindStroke, stopStroke } from "./stroke.js";
import { orders, recipes, stepAsset } from "./baking-recipes.js";
let washed = false;
export function resetBakingVisit() {
    washed = false;
}
let timer;
let mixingView;
let trayView;
let preparationView;
let mixingGeneration = 0;
function stopMixingView() {
    mixingGeneration++;
    preparationView?.destroy();
    preparationView = undefined;
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
export function startBaking() {
    stopBakingGestures();
    const game = el("baking");
    const adventure = campaignLevel();
    const order = adventure === undefined ? undefined : orders[adventure - 1];
    let portionCount = order?.count ?? 6;
    let selectedRecipe;
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
        if (item instanceof HTMLButtonElement)
            return;
        item.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ")
                return;
            event.preventDefault();
            accept();
        });
    }
    const image = (asset) => `<img src="${stepAsset(asset)}" alt="" draggable="false">`;
    const piece = (recipe) => `<span class="bakery-piece">${image(recipe.raw)}</span>`;
    const decorate = () => selectedRecipe === "tart" || (order?.finish ?? true);
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
        else if (!order && id === "bun")
            portionCount = 4;
        const shouldWash = !washed || adventure === 1;
        total = 1 + Number(usesParchment()) + recipe.prepare.length + (shouldWash ? 1 : 0) +
            ((order?.mix ?? true) ? 2 : 0) +
            (id === "bun" && decorate() ? 1 : 0) +
            (id === "tart" || decorate() ? recipe.after.length : 0) + (decorate() ? 1 : 0) +
            (order ? 1 : 0);
        const cook = () => {
            if (shouldWash)
                wash(recipe);
            else if (order?.mix ?? true)
                ingredients(recipe);
            else
                prepare(recipe);
        };
        if (order) {
            show(`Hileen tilaus · ${recipe.name} · ${portionCount} kpl`, `${image(recipe.ready)}${order.requested ? `<p>Hileen toive: ${order.requested.toLowerCase()}.</p>` : ""}<button type="button">Aloita tilaus</button>`);
            scene.querySelector("button").onclick = cook;
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
    scene.innerHTML = `<div class="bakery-recipes">${Object.entries(recipes).map(([id, recipe]) => `<button type="button" class="bakery-recipe" data-recipe="${id}">${image(recipe.ready)}${recipe.name}</button>`).join("")}</div>`;
    scene.querySelectorAll(".bakery-recipe")
        .forEach((choice) => {
        choice.onclick = () => begin(choice.dataset.recipe);
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
      <button type="button" class="bakery-step-action">${step.tool ? image(step.tool) : ""}${step.action}</button>
      <p class="bakery-step-count" aria-live="polite"></p>
      <div class="bakery-step-results" aria-hidden="true"></div>`);
        const target = scene.querySelector(".bakery-work-target");
        const action = scene.querySelector(".bakery-step-action");
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
            if (step.result)
                results.insertAdjacentHTML("beforeend", image(step.result));
            if (completed === count) {
                action.disabled = true;
                timer = setTimeout(() => runSteps(remaining, done), 450);
            }
        }
        if (step.tool)
            transfer(action, target, work);
        else
            gesture(target, {
                start() { },
                move() { },
                end(point) { if (point)
                    work(); },
            });
        action.onclick = work;
    }
    function wash(recipe) {
        show("Avaa hana, ota saippuaa, pese, huuhtele ja kuivaa kädet.", `
      <div class="baking-wash">
        <button type="button" class="wash-soap" aria-label="Ota saippuaa" disabled><img src="./assets/furniture/soap.webp" alt="" draggable="false"></button>
        <button type="button" class="wash-tap" aria-label="Avaa hana"><img src="./assets/furniture/tap.webp" alt="" draggable="false"><span class="wash-stream" aria-hidden="true"></span></button>
        <div class="wash-hands" aria-hidden="true">${image("sink")}<img class="wash-state" src="${stepAsset("hands-clean")}" alt="" draggable="false"></div>
        <button type="button" class="wash-scrub" hidden>Pese kädet</button>
        <button type="button" class="wash-dry" hidden>${image("towel")}Kuivaa kädet</button>
      </div>`);
        say("Hei pieni ystävä! Leikitään yhdessä.");
        const soap = scene.querySelector(".wash-soap");
        const tap = scene.querySelector(".wash-tap");
        const sink = scene.querySelector(".baking-wash");
        const hands = scene.querySelector(".wash-state");
        const scrub = scene.querySelector(".wash-scrub");
        const dry = scene.querySelector(".wash-dry");
        let washStage = 0;
        let waterOn = false;
        const washGeneration = mixingGeneration;
        void import("../phaser-room.js").then(({ createPreparationView }) => {
            if (washGeneration !== mixingGeneration || !sink.isConnected)
                return;
            preparationView = createPreparationView(sink);
            preparationView.setStage(washStage);
        }).catch(() => { });
        soap.onclick = () => {
            washStage = 1;
            hands.src = stepAsset("hands-soapy");
            preparationView?.setStage(washStage);
            sound();
            sink.classList.add("soapy");
            soap.disabled = true;
            scrub.hidden = false;
            scrub.focus({ preventScroll: true });
        };
        scrub.onclick = () => {
            scrub.hidden = true;
            tap.setAttribute("aria-label", "Huuhtele kädet");
            tap.disabled = false;
            tap.focus({ preventScroll: true });
        };
        tap.onclick = () => {
            if (!waterOn) {
                waterOn = true;
                washStage = 3;
                preparationView?.setStage(washStage);
                sink.classList.add("rinsing");
                tap.disabled = true;
                soap.disabled = false;
                soap.focus({ preventScroll: true });
                el("instruction").textContent = "Ota saippuaa ja pese kädet.";
                return;
            }
            washStage = 2;
            preparationView?.setStage(washStage);
            tap.disabled = true;
            sink.classList.add("rinsing");
            timer = setTimeout(() => {
                sink.classList.remove("rinsing", "soapy");
                washStage = 0;
                preparationView?.setStage(washStage);
                hands.src = stepAsset("hands-wet");
                dry.hidden = false;
                el("instruction").textContent = "Kuivaa kädet pyyhkeellä.";
                dry.focus({ preventScroll: true });
            }, 650);
        };
        dry.onclick = () => {
            dry.disabled = true;
            hands.src = stepAsset("hands-dry");
            timer = setTimeout(() => {
                washed = true;
                if (order?.mix ?? true)
                    ingredients(recipe);
                else
                    prepare(recipe);
            }, 450);
        };
    }
    function ingredients(recipe) {
        show("Vedä jauhot, muna ja maito kulhoon.", `
      <div class="bakery-ingredients">
        <div class="bakery-flour" role="button" tabindex="0" aria-label="Lisää jauhot">Jauhot</div>
        <div class="bakery-egg" role="button" tabindex="0" aria-label="Lisää muna">Muna</div>
        <div class="bakery-milk" role="button" tabindex="0" aria-label="Lisää maito">Maito</div>
      </div>
      <div class="bakery-bowl" aria-label="Sekoituskulho"></div>`);
        const bowl = scene.querySelector(".bakery-bowl");
        const items = [
            ...scene.querySelectorAll(".bakery-ingredients > div"),
        ];
        let added = 0;
        let ingredientMask = 0;
        for (const item of items)
            transfer(item, bowl, () => {
                if (item.hidden)
                    return;
                item.hidden = true;
                bowl.dataset.added = String(++added);
                ingredientMask |= item.classList.contains("bakery-flour") ? 1 : item.classList.contains("bakery-egg") ? 2 : 4;
                bowl.dataset.ingredient = ingredientMask & 1 ? "flour" : ingredientMask & 2 ? "egg" : "milk";
                sound();
                if (added === items.length)
                    mix(recipe);
            });
    }
    function mix(recipe) {
        show("Sekoita taikina pyörittämällä sormea kulhossa.", `
      <div class="bakery-bowl mixing" role="button" tabindex="0" aria-label="Sekoita taikina"><span class="bakery-spoon" aria-hidden="true"></span></div>
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
            mixingView = createMixingView(bowl);
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
      <div class="bakery-tray" aria-label="Uunipelti"><div class="bakery-slots"></div></div>
      <div class="bakery-paper" tabindex="0" role="button" aria-label="Aseta leivinpaperi pellille"></div>
      <div class="bakery-dough" hidden></div>`);
        const pan = scene.querySelector(".bakery-tray");
        const paper = scene.querySelector(".bakery-paper");
        const slots = scene.querySelector(".bakery-slots");
        const dough = scene.querySelector(".bakery-dough");
        const generation = mixingGeneration;
        void import("../phaser-room.js").then(({ createBakingTrayView }) => {
            if (generation !== mixingGeneration || !pan.isConnected)
                return;
            trayView = createBakingTrayView(pan, stepAsset(recipe.raw));
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
        show("Korvapuustit kohoavat.", image("bun-proofed"));
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
            src: stepAsset(result),
            alt: recipe.name,
            details: toppings.flatMap((name) => {
                const choice = recipe.decorations.find((decoration) => decoration.name === name);
                return choice ? [{
                        src: stepAsset(selectedRecipe === "tart" && "tool" in choice && typeof choice.tool === "string" ? choice.tool : choice.image),
                        alt: name,
                    }] : [];
            }),
        });
    }
    function finishRecipe(recipe) {
        runSteps(decorate() ? recipe.after : [], () => {
            if (!decorate()) {
                complete(recipe);
                return;
            }
            const count = order?.toppings ?? (selectedRecipe === "tart" ? 1 : portionCount);
            show("Valitse koriste ja lisää se leivonnaiseen.", `
        ${image(recipe.ready)}
        <div class="bakery-decorations"></div>
        <p class="bakery-decoration-status" aria-live="polite">0 / ${count}</p>
        <div class="bakery-step-results" aria-hidden="true"></div>`);
            const artwork = scene.querySelector("img");
            const status = scene.querySelector(".bakery-decoration-status");
            const options = scene.querySelector(".bakery-decorations");
            const requested = order?.requested;
            const results = scene.querySelector(".bakery-step-results");
            for (const decoration of recipe.decorations) {
                const button = document.createElement("button");
                button.type = "button";
                button.innerHTML = `${image("tool" in decoration ? decoration.tool : decoration.image)}${decoration.name}`;
                button.onclick = () => {
                    if (requested && toppings.length === 0 && decoration.name !== requested) {
                        feedback(`Hile toivoo ensimmäiseen kakkuun: ${requested.toLowerCase()}.`);
                        return;
                    }
                    toppings.push(decoration.name);
                    if (selectedRecipe !== "tart")
                        results.insertAdjacentHTML("beforeend", image(decoration.image));
                    artwork.src = stepAsset(selectedRecipe === "tart" && toppings.length > 1 ? "tart-mixed" : decoration.image);
                    status.textContent = `${toppings.length} / ${count}`;
                    if (toppings.length === count) {
                        if (selectedRecipe === "tart" && toppings.every((name) => name === "Mansikka"))
                            artwork.src = stepAsset("tart-slice");
                        options.querySelectorAll("button").forEach((choice) => { choice.disabled = true; });
                        timer = setTimeout(() => complete(recipe), 650);
                    }
                    else if (selectedRecipe === "tart")
                        button.disabled = true;
                };
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
        <div class="bakery-knob" role="slider" tabindex="0" aria-label="Uunin lämpötila" aria-valuemin="0" aria-valuemax="225" aria-valuenow="0" aria-disabled="true"></div>
        <output class="bakery-temp">0 °C</output>
        <div class="bakery-cavity">
          <div class="bakery-door" role="button" tabindex="0" aria-label="Avaa uunin luukku"></div>
        </div>
      </div>
      <div class="bakery-tray oven-tray lined" tabindex="0" role="button" aria-label="Siirrä pelti uuniin" hidden>${piece(recipe).repeat(portionCount)}</div>`);
        const cavity = scene.querySelector(".bakery-cavity");
        const door = scene.querySelector(".bakery-door");
        const knob = scene.querySelector(".bakery-knob");
        const temperature = scene.querySelector(".bakery-temp");
        const pan = scene.querySelector(".oven-tray");
        if (selectedRecipe === "cupcake" || selectedRecipe === "tart")
            pan.classList.add("bakery-shaped-pan", selectedRecipe);
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
                door.style.setProperty("--door-scale", String(1 - 0.78 * opening));
            },
            end(point) {
                door.style.removeProperty("--door-scale");
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
            loaded.innerHTML = piece(recipe).repeat(portionCount);
            cavity.prepend(loaded);
            const generation = mixingGeneration;
            if (usesParchment())
                void import("../phaser-room.js").then(({ createBakingTrayView }) => {
                    if (generation !== mixingGeneration || !loaded.isConnected)
                        return;
                    trayView = createBakingTrayView(loaded, stepAsset(recipe.raw));
                    trayView.line();
                    for (let index = 0; index < portionCount; index++)
                        trayView.place(index);
                }).catch(() => {
                    // Keep the existing oven portions available if graphics cannot load.
                });
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

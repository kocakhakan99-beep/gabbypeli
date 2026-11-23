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
import type { MixingView } from "../phaser-room.js";

type Recipe = { name: string; piece: string; art: string; heat: number };
const recipes: Recipe[] = [
  { name: "Piparit", piece: "pipari", art: "cookie", heat: 175 },
  { name: "Kuppikakut", piece: "kuppikakku", art: "cupcake", heat: 200 },
];
let timer: ReturnType<typeof setTimeout> | undefined;
let mixingView: MixingView | undefined;
let mixingGeneration = 0;

function stopMixingView(): void {
  mixingGeneration++;
  mixingView?.destroy();
  mixingView = undefined;
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
  heading(
    "cakey",
    "Hileen leipomo",
    "Valitse mitä haluat leipoa.",
    "Hileen keittiö",
  );
  const scene = document.createElement("div");
  scene.className = "bakery-scene";
  game.append(scene);
  progress(0, 6);

  function show(step: number, instruction: string, html: string): void {
    stopMixingView();
    scene.querySelectorAll<HTMLElement>("[data-gesture]").forEach(stopStroke);
    scene.innerHTML = html;
    feedback("");
    el("instruction").textContent = instruction;
    progress(step, 6);
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
    gesture(item, {
      start(point) {
        start = point;
      },
      move(_from, point) {
        item.style.translate =
          point.x - start.x + "px " + (point.y - start.y) + "px";
      },
      end(point) {
        item.style.removeProperty("translate");
        if (!point || Math.hypot(point.x - start.x, point.y - start.y) < 8)
          return;
        const box = destination.getBoundingClientRect();
        if (
          point.x >= box.left - 12 &&
          point.x <= box.right + 12 &&
          point.y >= box.top - 12 &&
          point.y <= box.bottom + 12
        )
          accept(point);
      },
    });
    item.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      accept();
    });
  }

  const piece = (recipe: Recipe) =>
    '<span class="bakery-piece ' + recipe.art + '" aria-hidden="true"></span>';
  scene.innerHTML = recipes
    .map(
      (recipe, i) =>
        '<button type="button" class="bakery-recipe" data-recipe="' +
        i +
        '">' +
        piece(recipe) +
        recipe.name +
        "</button>",
    )
    .join("");
  scene
    .querySelectorAll<HTMLButtonElement>(".bakery-recipe")
    .forEach((choice, i) => {
      choice.onclick = () => wash(recipes[i]);
    });

  function wash(recipe: Recipe): void {
    show(
      1,
      "Ota saippuaa ja huuhtele kädet.",
      `
      <div class="baking-wash">
        <button type="button" class="wash-soap" aria-label="Ota saippuaa"><img src="./assets/furniture/soap.webp" alt="" draggable="false"></button>
        <button type="button" class="wash-tap" aria-label="Huuhtele kädet" disabled><img src="./assets/furniture/tap.webp" alt="" draggable="false"><span class="wash-stream" aria-hidden="true"></span></button>
        <div class="wash-hands" aria-hidden="true"></div>
      </div>`,
    );
    say("Hei pieni ystävä! Leikitään yhdessä.");
    const soap = scene.querySelector<HTMLButtonElement>(".wash-soap")!;
    const tap = scene.querySelector<HTMLButtonElement>(".wash-tap")!;
    const sink = scene.querySelector(".baking-wash")!;
    soap.onclick = () => {
      sound();
      sink.classList.add("soapy");
      soap.disabled = true;
      tap.disabled = false;
    };
    tap.onclick = () => {
      tap.disabled = true;
      sink.classList.add("rinsing");
      timer = setTimeout(() => ingredients(recipe), 850);
    };
  }

  function ingredients(recipe: Recipe): void {
    show(
      2,
      "Vedä jauhot, muna ja maito kulhoon.",
      `
      <div class="bakery-ingredients">
        <div class="bakery-flour" role="button" tabindex="0" aria-label="Lisää jauhot">Jauhot</div>
        <div class="bakery-egg" role="button" tabindex="0" aria-label="Lisää muna">Muna</div>
        <div class="bakery-milk" role="button" tabindex="0" aria-label="Lisää maito">Maito</div>
      </div>
      <div class="bakery-bowl" aria-label="Sekoituskulho"></div>`,
    );
    const bowl = scene.querySelector<HTMLElement>(".bakery-bowl")!;
    const items = [
      ...scene.querySelectorAll<HTMLElement>(".bakery-ingredients > div"),
    ];
    let added = 0;
    for (const item of items)
      transfer(item, bowl, () => {
        if (item.hidden) return;
        item.hidden = true;
        bowl.dataset.added = String(++added);
        sound();
        if (added === items.length) mix(recipe);
      });
  }

  function mix(recipe: Recipe): void {
    show(
      3,
      "Sekoita taikina pyörittämällä sormea kulhossa.",
      `
      <div class="bakery-bowl mixing" tabindex="0" aria-label="Sekoita taikina"><span class="bakery-spoon" aria-hidden="true"></span></div>
      <progress class="bakery-progress" value="0" max="100" aria-label="Taikina sekoitettu"></progress>`,
    );
    const bowl = scene.querySelector<HTMLElement>(".bakery-bowl")!;
    const spoon = scene.querySelector<HTMLElement>(".bakery-spoon")!;
    const meter = scene.querySelector<HTMLProgressElement>("progress")!;
    let turns = 0;
    let spoonPosition = { x: 0.5, y: 0.5 };
    const generation = mixingGeneration;
    void import("../phaser-room.js").then(({ createMixingView }) => {
      if (generation !== mixingGeneration || !bowl.isConnected) return;
      mixingView = createMixingView(bowl);
      mixingView.move(spoonPosition.x, spoonPosition.y, meter.value / 100);
    }).catch(() => {
      // The existing spoon remains available if the graphics cannot load.
    });
    function add(amount: number): void {
      turns += amount;
      meter.value = Math.min(100, (Math.abs(turns) / (Math.PI * 4)) * 100);
      mixingView?.move(spoonPosition.x, spoonPosition.y, meter.value / 100);
      if (meter.value === 100) tray(recipe);
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
      4,
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
    transfer(paper, pan, () => {
      if (paper.hidden) return;
      paper.hidden = true;
      pan.classList.add("lined");
      el("instruction").textContent =
        "Siirrä leivonnaiset vapaisiin paikkoihin pellille.";
      dough.hidden = false;
      for (let i = 0; i < 6; i++) {
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
          item.hidden = true;
          sound();
          if (++filled === places.length) oven(recipe);
        });
    });
  }

  function oven(recipe: Recipe): void {
    show(
      5,
      "Vedä uunin luukkua alaspäin.",
      `
      <div class="bakery-oven">
        <div class="bakery-knob" role="slider" tabindex="0" aria-label="Uunin lämpötila" aria-valuemin="0" aria-valuemax="225" aria-valuenow="0" aria-disabled="true"></div>
        <output class="bakery-temp">0 °C</output>
        <div class="bakery-cavity">
          <div class="bakery-door" role="button" tabindex="0" aria-label="Avaa uunin luukku"></div>
        </div>
      </div>
      <div class="bakery-tray oven-tray lined" tabindex="0" role="button" aria-label="Siirrä pelti uuniin" hidden>${piece(recipe).repeat(6)}</div>`,
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
        const base = step === 2 ? 53 : 0;
        const angle = Math.max(0, Math.min(65, base + (point.y - start.y)));
        door.style.setProperty("--door-angle", -angle + "deg");
      },
      end(point) {
        door.style.removeProperty("--door-angle");
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
      loaded.innerHTML = piece(recipe).repeat(6);
      cavity.prepend(loaded);
      door.setAttribute("aria-label", "Sulje uunin luukku");
      el("instruction").textContent = "Vedä luukku ylös kiinni.";
      sound();
    });
    function setHeat(value: number): void {
      if (step !== 3) return;
      heat = Math.max(0, Math.min(recipe.heat, value));
      knob.style.setProperty("--dial", heat + "deg");
      knob.setAttribute("aria-valuenow", String(Math.round(heat)));
      temperature.value = Math.round(heat) + " °C";
      if (heat < recipe.heat) return;
      step = 4;
      knob.setAttribute("aria-disabled", "true");
      cavity.classList.add("oven-cooking");
      feedback("Leivonnaiset paistuvat.");
      timer = setTimeout(() => {
        progress(6, 6);
        finish("Pelti on valmis!", "Hile kiittää avusta.", "cakey");
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

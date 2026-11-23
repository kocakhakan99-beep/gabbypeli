import { el } from "../dom.js";
import { state } from "../state.js";
import {
  button,
  feedback,
  finish,
  heading,
  iconButton,
  progress,
  setAction,
  advanceAfterSuccess,
} from "../ui.js";
import { ding, say, unlock } from "../audio.js";
import {
  bindStroke,
  distanceToStroke,
  stopStroke,
  type Point,
} from "./stroke.js";

const recipes = [2, 1, 3, 4];
const counts = [
  "Ei vielä kakkuja.",
  "Yksi.",
  "Kaksi.",
  "Kolme.",
  "Neljä.",
  "Viisi.",
  "Kuusi.",
];
type Phase = "mix" | "oven" | "decorate" | "served";
let phase: Phase = "mix";
let recipe = 0;
let served = 0;
let topping = "berry";
const stirTurn = Math.PI * 1.5;
let ovenStep = 0;
let washTimer: ReturnType<typeof setTimeout> | undefined;
let ovenTimer: ReturnType<typeof setTimeout> | undefined;
const decorated = new Map<number, string>();

export function stopBakingGestures(): void {
  clearTimeout(ovenTimer);
  clearTimeout(washTimer);
  el("baking").querySelector(".baking-wash")?.remove();
  const controls = el("baking-check").parentElement;
  if (controls) controls.hidden = false;
  el("baking-steps").hidden = false;
  const recipeCard = el("baking").querySelector<HTMLElement>(".recipe-card");
  if (recipeCard) recipeCard.hidden = false;
  stopStroke(el("baking-add"));
  stopStroke(el("baking-plate"));
}

export function startBaking(): void {
  recipe = 0;
  const bowl = el("baking-add");
  let rotation = 0;
  let total = 0;
  let skipClick = false;
  let previousAngle: number | undefined;
  bindStroke(bowl, {
    start(point) {
      rotation = 0;
      total = 0;
      const rect = bowl.getBoundingClientRect();
      previousAngle = Math.atan2(
        point.y - rect.top - rect.height / 2,
        point.x - rect.left - rect.width / 2,
      );
    },
    move(from, to) {
      if (phase !== "mix") return;
      const movement = Math.hypot(to.x - from.x, to.y - from.y);
      total += movement;
      const rect = bowl.getBoundingClientRect();
      const angle = Math.atan2(
        to.y - rect.top - rect.height / 2,
        to.x - rect.left - rect.width / 2,
      );
      if (previousAngle !== undefined) {
        let delta = angle - previousAngle;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        if (
          Math.hypot(
            to.x - rect.left - rect.width / 2,
            to.y - rect.top - rect.height / 2,
          ) > 12
        )
          rotation += delta;
      }
      previousAngle = angle;
      bowl.style.setProperty(
        "--stir-angle",
        (rotation * 180) / Math.PI + "deg",
      );
      while (Math.abs(rotation) >= stirTurn && served < recipes[recipe]) {
        rotation = 0;
        addCake();
      }
      bowl.style.setProperty(
        "--stir-fill",
        Math.min(100, (Math.abs(rotation) / stirTurn) * 100) + "%",
      );
    },
    end(point) {
      bowl.style.removeProperty("--stir-angle");
      bowl.style.removeProperty("--stir-fill");
      if (total < 25) return;
      skipClick = true;
      previousAngle = undefined;
      setTimeout(() => {
        skipClick = false;
      }, 0);
    },
  });
  bowl.onclick = () => {
    if (!skipClick) addCake();
  };
  el("baking-bake").onclick = bake;
  const toppings = el("baking-toppings");
  toppings.querySelectorAll("button").forEach((choice) => {
    choice.onclick = () => {
      topping = choice.value;
      showToppingSelection();
    };
  });
  showRecipe();
  const kitchen = el("baking-kitchen");
  const controls = el("baking-check").parentElement;
  const wash = document.createElement("div");
  wash.className = "baking-wash";
  wash.innerHTML =
    '<button type="button" class="wash-soap" aria-label="Ota saippuaa"><img src="./assets/furniture/soap.webp" alt="" draggable="false"></button><button type="button" class="wash-tap" aria-label="Huuhtele kädet" disabled><img src="./assets/furniture/tap.webp" alt="" draggable="false"><span class="wash-stream" aria-hidden="true"></span></button><div class="wash-hands" aria-hidden="true"></div>';
  kitchen.before(wash);
  kitchen.hidden = true;
  if (controls) controls.hidden = true;
  el("baking-steps").hidden = true;
  const recipeCard = el("baking").querySelector<HTMLElement>(".recipe-card");
  if (recipeCard) recipeCard.hidden = true;
  heading(
    "cakey",
    "Pestään kädet",
    "Ota saippuaa ja huuhtele kädet hanassa.",
    "Hileen keittiö",
  );
  const soap = wash.querySelector<HTMLButtonElement>(".wash-soap")!;
  const tap = wash.querySelector<HTMLButtonElement>(".wash-tap")!;
  soap.onclick = () => {
    wash.classList.add("soapy");
    soap.disabled = true;
    tap.disabled = false;
    feedback("Nyt huuhdellaan kädet.");
  };
  tap.onclick = () => {
    tap.disabled = true;
    wash.classList.add("rinsing");
    feedback("Vesi huuhtelee saippuan pois.");
    washTimer = setTimeout(() => {
      wash.remove();
      if (controls) controls.hidden = false;
      el("baking-steps").hidden = false;
      if (recipeCard) recipeCard.hidden = false;
      showRecipe();
      playBakingDialogue();
    }, 850);
  };
}

function bindDecorating(): void {
  const plate = el("baking-plate");
  function sprinkle(from: Point, to: Point): void {
    if (phase !== "decorate") return;
    plate.querySelectorAll("button").forEach((cake, index) => {
      const rect = cake.getBoundingClientRect();
      const center = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      };
      if (
        distanceToStroke(center, from, to) <=
        Math.min(rect.width, rect.height) / 2
      ) {
        decorateCake(cake, index);
      }
    });
  }
  bindStroke(plate, {
    start: (point) => sprinkle(point, point),
    move: sprinkle,
    end() {},
  });
}

function showToppingSelection(): void {
  el("baking-toppings")
    .querySelectorAll("button")
    .forEach((choice) => {
      choice.setAttribute("aria-pressed", String(choice.value === topping));
    });
}

export function playBakingDialogue(): void {
  say("Hei pieni ystävä! Leikitään yhdessä.");
}

function showPhase(next: Phase): void {
  phase = next;
  el("baking-check").classList.remove("ready-to-serve");
  stopStroke(el("baking-plate"));
  if (next === "decorate") bindDecorating();
  const step = next === "mix" ? 0 : next === "oven" ? 1 : 2;
  el("baking-steps")
    .querySelectorAll("li")
    .forEach((item, index) => {
      if (index === step) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
      item.classList.toggle("done", index < step || next === "served");
    });
  el("baking-kitchen").hidden = next === "oven";
  const oven = el("baking-oven");
  oven.hidden = next !== "oven";
  oven.classList.remove("heating");
  el("baking-bake").disabled = false;
  el("baking-toppings").hidden = next !== "decorate";
  el("baking-add").hidden = next !== "mix";
  el("baking-check").hidden = next === "oven" || next === "served";
  iconButton(
    el("baking-check"),
    next === "mix" ? "oven" : "serve",
    next === "mix" ? "Laita uuniin" : "Tarjoile Hileelle",
  );
  el("baking-reset").hidden = next !== "mix";
  el("baking-plate").classList.remove("needs-topping");
  el("baking-plate").classList.toggle("decorating", next === "decorate");
  drawPlate();
}

function showRecipe(): void {
  served = 0;
  topping = "berry";
  decorated.clear();
  el("baking").dataset.recipe = recipe % 2 ? "cookie" : "cupcake";
  showToppingSelection();
  el("baking-dialogue").hidden = recipe !== 0;
  heading(
    "cakey",
    "Leivotaan " +
      recipes[recipe] +
      (recipe % 2 ? " piparia!" : " kuppikakkua!"),
    "Pyöritä sormea kulhossa tai napauta kulhoa.",
    "Hileen leipomo",
  );
  showPhase("mix");
  setAction("", null);
  feedback("Hile odottaa herkkuja. Leivotaan yhdessä!");
  progress(recipe, recipes.length);
  say("Leivotaan " + recipes[recipe] + " kuppikakkua. Kosketa taikinaa.");
}

function drawPlate(): void {
  el("baking-target").textContent = String(recipes[recipe]);
  el("baking-count").textContent = String(served);
  el("baking")
    .querySelector(".recipe-pictures")!
    .replaceChildren(
      ...Array.from({ length: recipes[recipe] }, (_, index) => {
        const cake = document.createElement("span");
        cake.className = "cupcake" + (index < served ? " counted" : "");
        return cake;
      }),
    );
  el("baking-plate").replaceChildren();
  for (let index = 0; index < served; index++) {
    const cake = button(
      "",
      () => {
        if (phase === "decorate") decorateCake(cake, index);
        else if (phase === "mix") {
          served--;
          drawPlate();
          say("Nyt lautasella on " + served + " kuppikakkua.");
        }
      },
      "cake-on-plate",
    );
    cake.innerHTML = '<span class="cupcake" aria-hidden="true"></span>';
    cake.setAttribute(
      "aria-label",
      (phase === "mix" ? "Poista kuppikakku " : "Koristele kuppikakku ") +
        (index + 1),
    );
    cake.disabled = phase === "served";
    if (decorated.has(index)) cake.dataset.topping = decorated.get(index);
    el("baking-plate").append(cake);
  }
}

function decorateCake(cake: HTMLButtonElement, index: number): void {
  if (phase !== "decorate" || decorated.get(index) === topping) return;
  decorated.set(index, topping);
  cake.dataset.topping = topping;
  ding("sprinkle");
  if (decorated.size === served) {
    feedback("Kaikki kakut on koristeltu! Nyt voit tarjoilla.");
    el("baking-check").classList.add("ready-to-serve");
  }
}

export function addCake(): void {
  if (state.mode !== "baking" || phase !== "mix") return;
  unlock();
  if (served === 6) {
    feedback("Lautanen on täynnä. Voit poistaa kakun koskettamalla sitä.");
    say("Lautanen on täynnä. Voit poistaa kakun koskettamalla sitä.");
    return;
  }
  served++;
  drawPlate();
  ding("sprinkle");
  say(counts[served]);
  feedback(
    served === recipes[recipe]
      ? "Juuri sopivasti! Laitetaanko kakut uuniin?"
      : "Lautasella on " + served + ".",
  );
}

export function resetPlate(): void {
  if (phase !== "mix") return;
  served = 0;
  drawPlate();
  feedback("Lautanen on tyhjä. Kokeillaan yhdessä uudestaan.");
  say("Lautanen on tyhjä. Leivotaan uudestaan.");
}

function bake(): void {
  if (phase !== "oven" || el("baking-bake").disabled) return;
  const next = [
    "Pue patalaput",
    "Avaa uunin luukku",
    "Laita leivonnaiset uuniin",
    "Sulje uunin luukku",
    "Säädä lämpötila ja paista",
  ];
  if (ovenStep < next.length) {
    el("baking-oven").dataset.step = String(++ovenStep);
    if (ovenStep < next.length) {
      iconButton(el("baking-bake"), "oven", next[ovenStep]);
      el("instruction").textContent = next[ovenStep];
      feedback(next[ovenStep]);
      return;
    }
  }
  el("baking-bake").disabled = true;
  el("baking-oven").classList.add("heating");
  feedback("Kakut kohoavat uunissa…");
  ovenTimer = setTimeout(finishBaking, 1350);
}

function finishBaking(): void {
  if (state.mode !== "baking" || phase !== "oven") return;
  setAction("", null);
  showPhase("decorate");
  el("instruction").textContent =
    "Valitse kuorrute ja liu’uta sormea kakkujen yli.";
  feedback("Kakut kypsyivät! Voit nyt koristella ne.");
  say("Kakut kypsyivät! Voit nyt koristella ne.");
  ding("discovery");
}

export function checkRecipe(): void {
  unlock();
  if (phase === "mix") {
    const target = recipes[recipe];
    if (served !== target) {
      feedback(
        served < target
          ? "Tarvitaan vielä lisää kakkuja."
          : "Nyt on vähän liikaa. Poista kakku koskettamalla sitä.",
      );
      say(
        served < target
          ? "Tarvitaan vielä lisää kakkuja."
          : "Nyt on vähän liikaa. Kosketa kakkua, niin se poistuu.",
      );
      return;
    }
    showPhase("oven");
    ovenStep = 0;
    el("baking-oven").dataset.step = "0";
    iconButton(el("baking-bake"), "oven", "Pue patalaput");
    el("instruction").textContent = "Pue patalaput.";
    feedback("Pue patalaput.");
    ding("piece");
    return;
  }
  if (phase !== "decorate") return;
  if (decorated.size < served) {
    feedback("Koristele vielä loput kakut.");
    el("baking-plate").classList.add("needs-topping");
    return;
  }
  setAction("", null);
  showPhase("served");
  el("instruction").textContent = "Hile sai kuppikakut!";
  progress(recipe + 1, recipes.length);
  feedback("Juuri sopivasti! Hile ilahtuu!");
  ding("celebration");
  say("Juuri sopivasti! Hile ilahtuu!");
  setAction(
    recipe === recipes.length - 1 ? "Juhlitaan!" : "Seuraava resepti",
    () => {
      recipe++;
      if (recipe === recipes.length)
        finish(
          "Mikä ihana leipuri!",
          "Leivoit kaikki herkut. Hile kiittää avusta!",
          "cakey",
        );
      else showRecipe();
    },
  );
  advanceAfterSuccess();
}

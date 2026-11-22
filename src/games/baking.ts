import { el } from "../dom.js";
import { state } from "../state.js";
import {
  button,
  feedback,
  finish,
  heading,
  progress,
  setAction,
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
const decorated = new Map<number, string>();

export function stopBakingGestures(): void {
  stopStroke(el("baking-add"));
  stopStroke(el("baking-plate"));
}

export function startBaking(): void {
  recipe = 0;
  const bowl = el("baking-add");
  let distance = 0;
  let skipClick = false;
  bindStroke(bowl, {
    start() {
      distance = 0;
    },
    move(from, to) {
      distance += Math.hypot(to.x - from.x, to.y - from.y);
      bowl.style.setProperty(
        "--stir-angle",
        Math.min(distance, 70) / 2 + "deg",
      );
    },
    end(point) {
      bowl.style.removeProperty("--stir-angle");
      if (point && distance >= 25) {
        skipClick = true;
        addCake();
        // A pointer click can follow this pointerup. A later tap is a new gesture.
        setTimeout(() => {
          skipClick = false;
        }, 0);
      }
    },
  });
  // The bowl handles both direct taps and gesture-driven mixing.
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
  playBakingDialogue();
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
  say(
    "Hei, pieni ystävä! Minä olen Gabby. Hile, mitä leivotaan tänään? Hei, Gabby! Leivotaan kaksi kuppikakkua. Yksi... kaksi. Haluatko auttaa? Leivotaan yhdessä.",
  );
}

function showPhase(next: Phase): void {
  phase = next;
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
  el("baking-oven").hidden = next !== "oven";
  el("baking-toppings").hidden = next !== "decorate";
  el("baking-add").hidden = next !== "mix";
  el("baking-check").hidden = next === "oven" || next === "served";
  el("baking-check").textContent =
    next === "mix" ? "Laita uuniin" : "Tarjoile Hileelle";
  el("baking-reset").hidden = next !== "mix";
  el("baking-plate").classList.toggle("decorating", next === "decorate");
  drawPlate();
}

function showRecipe(): void {
  served = 0;
  topping = "berry";
  decorated.clear();
  showToppingSelection();
  el("baking-dialogue").hidden = recipe !== 0;
  heading(
    "cakey",
    "Leivotaan " + recipes[recipe] + " kuppikakkua!",
    "Liikuta sormea kulhossa tai napauta. Jokaisesta vedosta tulee yksi kakku.",
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
  if (decorated.size === served)
    feedback("Kaikki kakut on koristeltu! Nyt voit tarjoilla.");
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
  if (phase !== "oven") return;
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
    el("instruction").textContent = "Paina uunin nappia, niin kakut kypsyvät.";
    feedback("Kakut ovat uunissa.");
    say("Kakut ovat uunissa.");
    ding("piece");
    return;
  }
  if (phase !== "decorate") return;
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
}

import {
  advanceAfterSuccess,
  button,
  feedback,
  finish,
  heading,
  picture,
  progress,
  setAction,
} from "../ui.js";
import { ding } from "../audio.js";
import { el } from "../dom.js";
import { shuffle } from "../utils.js";
import { bindStroke, stopStroke, type Point } from "./stroke.js";

const rounds = [
  [["yarn", "Lankakerä"]],
  [["berry", "Mansikka"]],
  [
    ["boat", "Vene"],
    ["shell", "Simpukka"],
  ],
  [
    ["blocks", "Palikat"],
    ["train", "Juna"],
  ],
] as const;
type Size = "small" | "large";
const labels = { small: "Pieni", large: "Iso" };
let round = 0;

export function stopSizeGestures(): void {
  el("choices").querySelectorAll<HTMLElement>(".size-toy").forEach(stopStroke);
}

export function renderSizes(): void {
  round = 0;
  buildRound();
}

function buildRound(): void {
  stopSizeGestures();
  const field = el("choices");
  field.replaceChildren();
  const objects = rounds[round];
  heading(
    "pandy",
    "Isot ja pienet",
    "Vedä lelu samankokoiseen koriin.",
    "Pandin leikkihuone",
  );
  el("pattern").hidden = true;
  progress(round, rounds.length);
  feedback("");
  setAction("", null);

  const shelf = document.createElement("div");
  shelf.className = "size-shelf";
  const bins = document.createElement("div");
  bins.className = "size-bins";
  field.append(shelf, bins);
  let selected: HTMLButtonElement | undefined;
  let remaining = objects.length * 2;
  const baskets = new Map<Size, HTMLButtonElement>();

  for (const size of ["small", "large"] as const) {
    const basket = button(
      "",
      () => {
        if (selected) deliver(selected, size);
      },
      "size-basket " + size,
    );
    basket.innerHTML =
      '<span class="size-bin" aria-hidden="true"><span></span></span>';
    basket.setAttribute("aria-label", labels[size] + " kori");
    baskets.set(size, basket);
    bins.append(basket);
  }

  function deliver(toy: HTMLButtonElement, size: Size): void {
    if (toy.disabled) return;
    const basket = baskets.get(size)!;
    if (toy.dataset.size !== size) {
      feedback("Kokeile toista koria.");
      basket.animate(
        [{ translate: "-4px" }, { translate: "4px" }, { translate: "0" }],
        {
          duration: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? 0
            : 240,
        },
      );
      return;
    }
    const art = toy.firstElementChild!.cloneNode(true);
    basket.querySelector(".size-bin > span")!.append(art);
    toy.disabled = true;
    toy.setAttribute("aria-pressed", "false");
    if (selected === toy) selected = undefined;
    ding("piece");
    feedback(labels[size] + " lelu löysi korinsa!");
    if (--remaining) return;
    progress(round + 1, rounds.length);
    setAction(
      round + 1 === rounds.length ? "Juhlitaan!" : "Seuraavat lelut",
      () => {
        if (++round < rounds.length) buildRound();
        else
          finish(
            "Taitavaa lajittelua!",
            "Kaikki lelut ovat omissa koreissaan.",
            "pandy",
          );
      },
    );
    advanceAfterSuccess();
  }

  const toys = shuffle(
    objects.flatMap(([id, name]) =>
      (["small", "large"] as const).map((size) => ({ id, name, size })),
    ),
  );
  for (const { id, name, size } of toys) {
    const toy = button(
      "",
      () => {
        selected?.setAttribute("aria-pressed", "false");
        selected = toy;
        toy.setAttribute("aria-pressed", "true");
      },
      "size-toy " + size,
    );
    toy.dataset.size = size;
    toy.setAttribute("aria-label", labels[size] + " " + name.toLowerCase());
    toy.setAttribute("aria-pressed", "false");
    toy.innerHTML = picture(id);
    shelf.append(toy);
    let origin: Point;
    let ghost: HTMLElement | undefined;
    bindStroke(toy, {
      start(point) {
        origin = point;
      },
      move(_from, point) {
        if (!ghost && Math.hypot(point.x - origin.x, point.y - origin.y) < 8)
          return;
        if (!ghost) {
          ghost = toy.firstElementChild!.cloneNode(true) as HTMLElement;
          ghost.classList.add("size-ghost", size);
          document.getElementById("gabby-fi")!.append(ghost);
          toy.classList.add("dragging");
        }
        ghost.style.left = point.x + "px";
        ghost.style.top = point.y + "px";
      },
      end(point) {
        if (!ghost) return;
        ghost.remove();
        ghost = undefined;
        toy.classList.remove("dragging");
        if (!point) return;
        for (const [binSize, basket] of baskets) {
          const box = basket.getBoundingClientRect();
          if (
            point.x >= box.left &&
            point.x <= box.right &&
            point.y >= box.top &&
            point.y <= box.bottom
          ) {
            deliver(toy, binSize);
            break;
          }
        }
      },
    });
  }
}

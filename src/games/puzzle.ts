import { playObjects } from "../play-objects.js";
import { bindStroke, stopStroke, type Point } from "./stroke.js";
import { root } from "../dom.js";
import {
  button,
  feedback,
  finish,
  heading,
  picture,
  progress,
  setAction,
} from "../ui.js";
import { ding, say, unlock } from "../audio.js";
import { el } from "../dom.js";
import { friends } from "../data.js";
import { shuffle } from "../utils.js";
import { state } from "../state.js";

const scenes = [
  ...friends,
  ...playObjects.map((object) => ({ ...object, room: "Esinepalapelit" })),
];

export function cropPosition(piece: number) {
  const isObject = state.puzzleArt >= friends.length;
  const grid = isObject ? 3 : 2;
  const tile = isObject ? state.puzzleArt - friends.length : state.puzzleArt;
  const ax = tile % grid,
    ay = Math.floor(tile / grid),
    cols = 2,
    rows = state.puzzleSize / 2,
    x = piece % 2,
    y = Math.floor(piece / 2);
  return {
    x: (100 * (ax * cols + x)) / (grid * cols - 1),
    y: (100 * (ay * rows + y)) / (grid * rows - 1),
    grid,
  };
}

export function crop(piece: number) {
  const p = cropPosition(piece);
  return (
    '<span class="crop" style="--bx:' +
    p.x +
    "%;--by:" +
    p.y +
    "%;--puzzle-columns:" +
    p.grid * 2 * 100 +
    "%;--puzzle-rows:" +
    p.grid * state.puzzleSize * 50 +
    (p.grid === 3 ? "%;--puzzle-image:var(--object-atlas)" : "%") +
    '" aria-hidden="true"></span>'
  );
}

export function initPuzzle() {
  stopPuzzleDrag();
  state.selected = null;
  state.placed = new Set();
  const f = scenes[state.puzzleArt];
  heading(
    state.puzzleArt < friends.length ? f.id : "fairy",
    state.puzzleArt < friends.length
      ? "Kokoa taikakuva"
      : "Kokoa kuva: " + f.name,
    "Raahaa pala paikalleen tai kosketa ensin palaa ja sitten sen paikkaa.",
    f.room,
  );
  el("puzzle-settings").replaceChildren();
  [2, 4, 6].forEach((n) => {
    const b = button(n + " palaa", () => {
      state.puzzleSize = n;
      initPuzzle();
    });
    b.setAttribute("aria-pressed", String(n === state.puzzleSize));
    el("puzzle-settings").append(b);
  });
  el("scenes").replaceChildren();
  scenes.forEach((f, i) => {
    const b = button(
      "",
      () => {
        state.puzzleArt = i;
        initPuzzle();
      },
      "scene-choice",
    );
    b.innerHTML = picture(f.id);
    b.setAttribute("aria-label", "Palapeli: " + f.name);
    b.setAttribute("aria-pressed", String(i === state.puzzleArt));
    el("scenes").append(b);
  });
  el("board").className =
    "board " +
    (state.puzzleSize === 2 ? "two" : state.puzzleSize === 6 ? "six" : "four");
  el("tray").className =
    "piece-tray " +
    (state.puzzleSize === 2 ? "two" : state.puzzleSize === 6 ? "six" : "four");
  el("board").replaceChildren();
  el("tray").replaceChildren();
  for (let i = 0; i < state.puzzleSize; i++) {
    const b = button("", () => place(i), "slot");
    b.innerHTML = crop(i);
    b.setAttribute(
      "aria-label",
      "Paikka " +
        (i + 1) +
        ": " +
        (i % 2 === 0 ? "vasen" : "oikea") +
        (state.puzzleSize === 4
          ? i < 2
            ? " yläkulma"
            : " alakulma"
          : " puoli"),
    );
    b.dataset.piece = String(i);
    el("board").append(b);
  }
  shuffle(Array.from({ length: state.puzzleSize }, (_, i) => i)).forEach(
    (i) => {
      const b = button("", () => select(i), "piece");
      bindPieceDrag(b, i);
      b.innerHTML = crop(i);
      b.dataset.piece = String(i);
      b.setAttribute("aria-label", "Kuvan pala " + (i + 1));
      b.setAttribute("aria-pressed", "false");
      el("tray").append(b);
    },
  );
  setAction("", null);
  feedback("Valitse ensin yksi pala.");
  progress(0, state.puzzleSize);
  say(
    "Kootaan kuva! Kosketa ensin palaa ja sitten sen paikkaa. Haalea kuva auttaa.",
  );
}

export function select(i: number) {
  if (state.placed.has(i)) return;
  unlock();
  state.selected = i;
  el("tray")
    .querySelectorAll("button")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(Number(b.dataset.piece) === i)),
    );
  feedback("Mihin tämä pala sopii?");
  say("Mihin tämä pala sopii?");
}

export function place(i: number) {
  if (state.placed.has(i)) return;
  if (state.selected === null) {
    feedback("Valitse ensin pala oikealta.");
    say("Valitse ensin pala.");
    return;
  }
  if (state.selected !== i) {
    feedback("Katsotaan kuvaa. Kokeile toista paikkaa.");
    el("board")
      .querySelectorAll("button")
      .forEach((b) =>
        b.classList.toggle("cue", Number(b.dataset.piece) === state.selected),
      );
    say("Katsotaan yhdessä. Missä näkyvät samat värit?");
    return;
  }
  state.placed.add(i);
  el("board")
    .querySelectorAll("button")
    .forEach((b) => {
      b.classList.remove("cue");
      if (Number(b.dataset.piece) === i) {
        b.classList.add("filled");
        b.disabled = true;
      }
    });
  el("tray")
    .querySelectorAll("button")
    .forEach((b) => {
      if (Number(b.dataset.piece) === i) {
        b.disabled = true;
        b.setAttribute("aria-pressed", "false");
      }
    });
  state.selected = null;
  progress(state.placed.size, state.puzzleSize);
  ding("piece");
  if (state.placed.size === state.puzzleSize) {
    feedback("Kuva on valmis! Sinä kokosit sen!");
    setAction("Juhlitaan!", () =>
      finish(
        "Taikakuva on valmis!",
        "Kokosit kuvan itse. Annetaan yhdessä ylävitoset!",
        state.puzzleArt < friends.length ? scenes[state.puzzleArt].id : "fairy",
      ),
    );
    say("Kuva on valmis! Sinä kokosit sen!");
  } else {
    feedback("Se sopi! Valitse seuraava pala.");
    say("Se sopi! Valitse seuraava pala.");
  }
}

export function showPuzzleHint() {
  if (state.placed.size === state.puzzleSize) return;
  if (state.selected === null) {
    const nextPiece = Array.from(
      { length: state.puzzleSize },
      (_, i) => i,
    ).find((i) => !state.placed.has(i));
    if (nextPiece !== undefined) select(nextPiece);
  }
  el("board")
    .querySelectorAll("button")
    .forEach((button) => {
      button.classList.toggle(
        "cue",
        Number(button.dataset.piece) === state.selected,
      );
    });
  feedback("Valittu pala sopii korostettuun paikkaan.");
  say("Kosketa korostettua paikkaa kuvassa.");
}

export function stopPuzzleDrag(): void {
  el("tray").querySelectorAll("button").forEach(stopStroke);
}

function bindPieceDrag(piece: HTMLButtonElement, index: number): void {
  let start: Point;
  let ghost: HTMLElement | undefined;
  bindStroke(piece, {
    start(point) {
      start = point;
    },
    move(_from, to) {
      if (!ghost) {
        if (Math.hypot(to.x - start.x, to.y - start.y) < 8) return;
        const { width, height } = piece.getBoundingClientRect();
        ghost = document.createElement("div");
        ghost.className = "puzzle-ghost " + el("tray").classList[1];
        ghost.setAttribute("aria-hidden", "true");
        ghost.style.width = width + "px";
        ghost.style.height = height + "px";
        ghost.innerHTML = piece.innerHTML;
        root.append(ghost);
        select(index);
      }
      ghost.style.left = to.x + "px";
      ghost.style.top = to.y + "px";
    },
    end(point) {
      if (!ghost) return;
      ghost.remove();
      ghost = undefined;
      if (!point) return;
      const slot = document
        .elementFromPoint(point.x, point.y)
        ?.closest<HTMLButtonElement>("#gf-board .slot");
      if (slot) place(Number(slot.dataset.piece));
    },
  });
}

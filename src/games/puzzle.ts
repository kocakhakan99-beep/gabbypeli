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

export function cropPosition(piece: number) {
  const ax = state.puzzleArt % 2,
    ay = Math.floor(state.puzzleArt / 2),
    cols = 2,
    rows = state.puzzleSize / 2,
    x = piece % 2,
    y = Math.floor(piece / 2);
  return {
    x: (100 * (ax * cols + x)) / (2 * cols - 1),
    y: (100 * (ay * rows + y)) / (2 * rows - 1),
  };
}

export function crop(piece: number) {
  const p = cropPosition(piece);
  return (
    '<span class="crop" style="--bx:' +
    p.x +
    "%;--by:" +
    p.y +
    '%" aria-hidden="true"></span>'
  );
}

export function initPuzzle() {
  state.selected = null;
  state.placed = new Set();
  const f = friends[state.puzzleArt];
  heading(
    f.id,
    "Kokoa taikakuva",
    "Kosketa palaa. Kosketa sitten sen paikkaa kuvassa.",
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
  friends.forEach((f, i) => {
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
        friends[state.puzzleArt].id,
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

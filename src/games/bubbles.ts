import { advanceAfterSuccess } from "../ui.js";
import { el } from "../dom.js";
import {
  button,
  feedback,
  finish,
  heading,
  progress,
  setAction,
} from "../ui.js";
import { ding, say, unlock } from "../audio.js";
import { shuffle } from "../utils.js";

const rounds = [
  { target: "blue", label: "siniset ympyrät", count: 2, other: "pink" },
  { target: "pink", label: "vaaleanpunaiset ympyrät", count: 3, other: "blue" },
  { target: "square", label: "neliöt", count: 2, other: "blue" },
  { target: "blue", label: "siniset ympyrät", count: 4, other: "square" },
] as const;
let round = 0;
let remaining = 0;
let completed = false;

export function startBubbles(): void {
  round = 0;
  renderRound();
}

function renderRound(): void {
  const task = rounds[round];
  el("bubble-target").className = "bubble-target " + task.target;
  remaining = task.count;
  completed = false;
  heading(
    "mercat",
    "Etsi kaikki " + task.label + ".",
    "Kosketa sopivia kuplia. Ne poksahtavat!",
    "Merikatin kuplataika",
  );
  setAction("", null);
  progress(round, rounds.length);
  feedback("Etsittäviä kuplia: " + remaining);
  el("bubble-field").replaceChildren();
  const bubbles = shuffle([
    ...Array.from({ length: task.count }, () => ({
      kind: task.target,
      correct: true,
    })),
    ...Array.from({ length: 2 }, () => ({ kind: task.other, correct: false })),
  ]);
  bubbles.forEach((bubble, index) => {
    const choice = button(
      "",
      () => {
        if (completed || choice.disabled) return;
        unlock();
        if (!bubble.correct) {
          feedback("Tutkitaan yhdessä. Etsi " + task.label + ".");
          say("Tutkitaan yhdessä. Etsi " + task.label + ".");
          return;
        }
        choice.disabled = true;
        choice.classList.add("popped");
        choice.setAttribute(
          "aria-label",
          "Kupla " + (index + 1) + ", löydetty",
        );
        remaining--;
        ding("bubble");
        if (remaining > 0) {
          feedback("Löytyi! Vielä " + remaining + ".");
          say("Löytyi! Vielä " + remaining + ".");
          return;
        }
        completed = true;
        progress(round + 1, rounds.length);
        feedback("Kaikki löytyivät. Ihanaa kuplataikaa!");
        say("Kaikki löytyivät. Ihanaa kuplataikaa!");
        setAction(
          round === rounds.length - 1 ? "Juhlitaan!" : "Lisää kuplia",
          () => {
            round++;
            if (round === rounds.length)
              finish(
                "Kuplataikuri!",
                "Tunnistit värit ja muodot. Merikatti kiittää!",
                "mercat",
              );
            else renderRound();
          },
        );
        advanceAfterSuccess();
      },
      "bubble-button " + bubble.kind,
    );
    choice.innerHTML = '<span class="bubble-shape" aria-hidden="true"></span>';
    const names = {
      blue: "sininen ympyrä",
      pink: "vaaleanpunainen ympyrä",
      square: "neliö",
    };
    choice.setAttribute(
      "aria-label",
      "Kupla " + (index + 1) + ", " + names[bubble.kind],
    );
    el("bubble-field").append(choice);
  });
  say("Etsi kaikki " + task.label + ".");
}

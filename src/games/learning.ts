import { advanceAfterSuccess } from "../ui.js";
import type { Choice } from "../types.js";
import {
  button,
  feedback,
  finish,
  heading,
  progress,
  setAction,
} from "../ui.js";
import { ding, say, unlock } from "../audio.js";
import { el } from "../dom.js";
import { friends, lessons } from "../data.js";
import { shuffle } from "../utils.js";
import { state } from "../state.js";

export function renderLearn() {
  state.learnDone = false;
  const r = lessons[state.learnIndex],
    f = friends[r.art];
  heading(f.id, r.title, "Kosketa sopivaa kuvaa.", f.room);
  el("pattern").hidden = !r.pattern;
  el("choices").replaceChildren();
  shuffle(r.options).forEach((o) => {
    const b = button("", () => answer(b, o), "choice");
    b.innerHTML = o[1] + "<span>" + o[0] + "</span>";
    b.setAttribute("aria-label", o[0]);
    el("choices").append(b);
  });
  progress(state.learnIndex, lessons.length);
  setAction("", null);
  feedback("");
  say(r.speech);
}

export function answer(b: HTMLButtonElement, o: Choice) {
  if (state.learnDone || b.disabled) return;
  unlock();
  const r = lessons[state.learnIndex];
  if (o[2]) {
    state.learnDone = true;
    b.classList.add("correct");
    el("choices")
      .querySelectorAll("button")
      .forEach((x) => (x.disabled = true));
    feedback(r.win);
    progress(state.learnIndex + 1, lessons.length);
    ding("bubble");
    say(r.win);
    setAction(
      state.learnIndex === lessons.length - 1 ? "Juhlitaan!" : "Seuraava puuha",
      () => {
        state.learnIndex++;
        if (state.learnIndex === lessons.length)
          finish(
            "Kaikki puuhat tehty!",
            "Auttoit Gabbya ja kaikkia kavereita. Olet taitava pieni apuri!",
            "gabby",
          );
        else renderLearn();
      },
    );
    advanceAfterSuccess();
  } else {
    b.disabled = true;
    feedback("Tutkitaan yhdessä. " + r.title);
    el("choices")
      .querySelectorAll("button")
      .forEach((x) => {
        if (!x.disabled) x.classList.add("hint");
      });
    say("Tutkitaan yhdessä. " + r.speech);
  }
}

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
import { shuffle } from "../utils.js";

const tasks = [
  { target: "suuri", size: 78 },
  { target: "pieni", size: 36 },
  { target: "suuri", size: 78 },
  { target: "pieni", size: 36 },
];

export function renderSizes() {
  const task = tasks[state.learnIndex];
  state.learnDone = false;
  heading(
    "fairy",
    "Etsi " + task.target + " pallo.",
    "Kosketa sopivan kokoista palloa.",
    "Puutarhan palloleikki",
  );
  el("pattern").hidden = true;
  el("choices").replaceChildren();
  feedback("");
  setAction("", null);
  progress(state.learnIndex, tasks.length);

  for (const size of shuffle([36, 78])) {
    const label = size === 36 ? "Pieni" : "Suuri";
    const choice = button(
      "",
      () => {
        if (state.learnDone || choice.disabled) return;
        unlock();
        if (size !== task.size) {
          feedback("Katsotaan yhdessä. Kumpi on " + task.target + "?");
          say("Katsotaan yhdessä. Etsi " + task.target + " pallo.");
          return;
        }
        state.learnDone = true;
        choice.classList.add("correct");
        el("choices")
          .querySelectorAll("button")
          .forEach((b) => (b.disabled = true));
        feedback("Löysit sen! " + label + " pallo!");
        progress(state.learnIndex + 1, tasks.length);
        ding("discovery");
        say("Löysit sen! " + label + " pallo!");
        setAction(
          state.learnIndex === tasks.length - 1
            ? "Juhlitaan!"
            : "Seuraava pallo",
          () => {
            state.learnIndex++;
            if (state.learnIndex === tasks.length) {
              finish(
                "Taitavaa vertailua!",
                "Tunnistit suuret ja pienet pallot!",
                "fairy",
              );
            } else renderSizes();
          },
        );
      },
      "choice",
    );
    choice.innerHTML =
      '<span class="ball" aria-hidden="true" style="width:' +
      size +
      "px;height:" +
      size +
      'px"></span><span>' +
      label +
      "</span>";
    choice.setAttribute("aria-label", label);
    el("choices").append(choice);
  }
  say("Etsi " + task.target + " pallo.");
}

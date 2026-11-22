import { playObjects } from "./play-objects.js";
import { completeGame } from "./storage.js";
import { ding, say } from "./audio.js";
import { el } from "./dom.js";
import { friends } from "./data.js";
import { state } from "./state.js";

export function button(label: string, fn: () => void, cls = "tool") {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls + " cursor-interaction";
  b.textContent = label;
  b.addEventListener("click", fn);
  return b;
}

export function picture(art: string) {
  const tile = playObjects.findIndex(({ id }) => id === art);
  if (tile >= 0) {
    return (
      '<span class="picture" data-object aria-hidden="true" style="--tile-x:' +
      (tile % 3) * 50 +
      "%;--tile-y:" +
      Math.floor(tile / 3) * 50 +
      '%"></span>'
    );
  }
  return (
    '<span class="picture" data-art="' + art + '" aria-hidden="true"></span>'
  );
}

export function cat() {
  return '<span class="cat-back" aria-hidden="true"><span class="cat-eyes"></span><span class="cat-nose"></span></span>';
}

export function heading(
  art: string,
  title: string,
  instruction: string,
  room: string,
) {
  el("portrait").dataset.art = art;
  el("play").dataset.room = art;
  el("portrait").setAttribute(
    "aria-label",
    friends.find((f) => f.id === art)?.name ?? "Gabbyn ystävä",
  );
  el("title").textContent = title;
  el("instruction").textContent = instruction;
  el("room").textContent = room;
}

export function progress(n: number, total: number) {
  el("stars").innerHTML = Array.from(
    { length: total },
    (_, i) =>
      '<span class="star ' +
      (i < n ? "earned" : "") +
      '" aria-hidden="true"></span>',
  ).join("");
  el("stars").setAttribute("aria-label", n + " / " + total + " valmiina");
}

export function feedback(t: string) {
  el("feedback").textContent = t;
}

let advanceTimer: ReturnType<typeof setTimeout> | undefined;
export function cancelAdvance(): void {
  if (advanceTimer !== undefined) clearTimeout(advanceTimer);
  advanceTimer = undefined;
}
export function advanceAfterSuccess(): void {
  cancelAdvance();
  const action = state.action;
  if (!action) return;
  advanceTimer = setTimeout(() => {
    advanceTimer = undefined;
    if (state.action !== action || el("play").hidden) return;
    state.action = null;
    action();
  }, 3500);
}
export function setAction(label: string, fn: (() => void) | null) {
  cancelAdvance();
  el("action").textContent = label;
  el("action").hidden = !label;
  state.action = fn;
}

export function finish(title: string, text: string, art: string) {
  if (state.mode) completeGame(state.mode);
  setAction("", null);
  el("content").hidden = true;
  el("win").hidden = false;
  el("win-title").textContent = title;
  el("win-text").textContent = text;
  el("win-art").dataset.art = art;
  el("win-art").classList.remove("pop");
  void el("win-art").offsetWidth;
  el("win-art").classList.add("pop");
  ding();
  say(title + " " + text);
}

import { playObjects } from "./play-objects.js";
import { completeGame } from "./storage.js";
import { ding, say } from "./audio.js";
import { el } from "./dom.js";
import { friends } from "./data.js";
import { state } from "./state.js";
export function button(label, fn, cls = "tool") {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls + " cursor-interaction";
    b.textContent = label;
    b.addEventListener("click", fn);
    return b;
}
export function picture(art) {
    const tile = playObjects.findIndex(({ id }) => id === art);
    if (tile >= 0) {
        return ('<span class="picture" data-object aria-hidden="true" style="--tile-x:' +
            (tile % 3) * 50 +
            "%;--tile-y:" +
            Math.floor(tile / 3) * 50 +
            '%"></span>');
    }
    return ('<span class="picture" data-art="' + art + '" aria-hidden="true"></span>');
}
export function cat() {
    return '<span class="cat-back" aria-hidden="true"><span class="cat-eyes"></span><span class="cat-nose"></span></span>';
}
export function heading(art, title, instruction, room) {
    el("portrait").dataset.art = art;
    el("portrait").setAttribute("aria-label", friends.find((f) => f.id === art)?.name ?? "Gabbyn ystävä");
    el("title").textContent = title;
    el("instruction").textContent = instruction;
    el("room").textContent = room;
}
export function progress(n, total) {
    el("stars").innerHTML = Array.from({ length: total }, (_, i) => '<span class="star ' +
        (i < n ? "earned" : "") +
        '" aria-hidden="true"></span>').join("");
    el("stars").setAttribute("aria-label", n + " / " + total + " valmiina");
}
export function feedback(t) {
    el("feedback").textContent = t;
}
export function setAction(label, fn) {
    el("action").textContent = label;
    el("action").hidden = !label;
    state.action = fn;
}
export function finish(title, text, art) {
    if (state.mode)
        completeGame(state.mode);
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

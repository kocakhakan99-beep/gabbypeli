import { playObjects } from "./play-objects.js";
import { completeGame } from "./storage.js";
import { ding, say } from "./audio.js";
import { el } from "./dom.js";
import { friends } from "./data.js";
import { state } from "./state.js";
const glyphs = {
    home: '<path d="m6 21 18-15 18 15v19H28V28h-8v12H6z"/>',
    hint: '<path d="M24 6c-9 0-15 6-15 13 0 6 4 10 9 10 3 0 4-2 6-2s3 2 6 2c5 0 9-4 9-10C39 12 33 6 24 6Z"/><path d="M14 10 11 5m10 3-1-6m9 8 4-5M19 19v1m10-1v1m-8 5h6"/>',
    voice: '<path d="M7 19h7l10-8v26l-10-8H7z"/><path d="M30 17c4 4 4 10 0 14m5-19c7 7 7 17 0 24"/>',
    mute: '<path d="M7 19h7l10-8v26l-10-8H7z"/><path d="m31 19 10 10m0-10L31 29"/>',
    replay: '<path d="M9 14A15 15 0 1 1 6 25"/><path d="M9 5v9H1m23-3v9l6 4"/>',
    next: '<path d="M24 5 29 17 42 18 32 27 35 40 24 33 13 40 16 27 6 18 19 17z"/>',
    friends: '<path d="m4 17 2-8 8 2 4 6v14H5zM44 17l-2-8-8 2-4 6v14h13zM16 17l3-9 5-4 5 4 3 9v19H16z"/><circle cx="12" cy="22" r="2"/><circle cx="36" cy="22" r="2"/><circle cx="24" cy="19" r="2"/>',
    objects: '<path d="M7 17h34l-3 22H10zM12 17l4-9h16l4 9M17 25v8m8-8v8m8-8v8"/>',
    cards: '<rect x="5" y="8" width="20" height="28" rx="4"/><rect x="23" y="12" width="20" height="28" rx="4"/><path d="M15 19h1m17 7h1"/>',
    cards2: '<rect x="5" y="5" width="38" height="38" rx="7"/><circle cx="17" cy="24" r="4"/><circle cx="31" cy="24" r="4"/>',
    cards4: '<rect x="5" y="5" width="38" height="38" rx="7"/><circle cx="17" cy="17" r="3"/><circle cx="31" cy="17" r="3"/><circle cx="17" cy="31" r="3"/><circle cx="31" cy="31" r="3"/>',
    cards6: '<rect x="5" y="5" width="38" height="38" rx="7"/><circle cx="16" cy="15" r="2.5"/><circle cx="24" cy="15" r="2.5"/><circle cx="32" cy="15" r="2.5"/><circle cx="16" cy="32" r="2.5"/><circle cx="24" cy="32" r="2.5"/><circle cx="32" cy="32" r="2.5"/>',
    puzzle: '<path d="M8 8h9a6 6 0 1 1 12 0h9v12a6 6 0 1 0 0 12v8H25a6 6 0 1 0-12 0H8z"/>',
    cake: '<path d="m8 23 5 19h22l5-19M8 23c0-4 4-7 9-7 0-6 4-10 7-10s7 4 7 10c5 0 9 3 9 7zM19 22v2m10-2v2"/>',
    oven: '<rect x="7" y="6" width="34" height="36" rx="5"/><path d="M12 12h24M13 19h22v16H13zM16 9h1m5 0h1m5 0h1m5 0h1"/>',
    serve: '<path d="M5 27c2 10 9 15 19 15s17-5 19-15zM8 22h32M15 16h18M20 10h8"/>',
    flower: '<circle cx="24" cy="24" r="6"/><circle cx="24" cy="11" r="7"/><circle cx="37" cy="24" r="7"/><circle cx="24" cy="37" r="7"/><circle cx="11" cy="24" r="7"/><path d="M24 43v5m-8 0h16"/>',
    brush: '<path d="m8 34 21-22 9 9-22 21H8zM27 15l7 7M8 34c-4 3-3 10 2 11 4 0 7-3 6-7"/>',
    paw: '<ellipse cx="24" cy="31" rx="12" ry="10"/><ellipse cx="10" cy="17" rx="5" ry="7"/><ellipse cx="21" cy="11" rx="5" ry="7"/><ellipse cx="32" cy="11" rx="5" ry="7"/><ellipse cx="41" cy="18" rx="5" ry="7"/>',
    undo: '<path d="M17 16H7l10-10M8 16h21a12 12 0 1 1 0 24h-6"/>',
    berry: '<path d="M11 15c4-5 22-5 26 0-1 16-8 26-13 29-5-3-12-13-13-29Z"/><path d="M17 12c0-6 14-6 14 0m-8-1c-4-9-11-7-12-3 4 0 7 1 12 3m0 0c4-9 11-7 12-3-4 0-7 1-12 3"/>',
    blueberry: '<circle cx="15" cy="28" r="8"/><circle cx="29" cy="16" r="8"/><circle cx="33" cy="32" r="8"/><path d="m12 19 3-3 3 3m8-8 3-3 3 3m1 16 3-3 3 3"/>',
    sun: '<circle cx="24" cy="24" r="9"/><path d="M24 3v8m0 26v8M3 24h8m26 0h8M9 9l6 6m18 18 6 6M39 9l-6 6M15 33l-6 6"/>',
};
export function iconButton(button, icon, label) {
    button.classList.add("icon-button");
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = `<svg class="button-glyph" viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${glyphs[icon] ?? glyphs.paw}</svg>`;
}
function iconForLabel(label) {
    const text = label.toLocaleLowerCase("fi");
    if (/koti|leikki|takaisin|muu/.test(text))
        return "home";
    if (/vihje/.test(text))
        return "hint";
    if (/toista|kuuntele/.test(text))
        return "voice";
    if (/uudestaan/.test(text))
        return "replay";
    if (/kaver/.test(text))
        return "friends";
    if (/esine/.test(text))
        return "objects";
    if (/paria|palaa/.test(text)) {
        const count = text.match(/\b(2|4|6)\b/)?.[1];
        return count ? `cards${count}` : "cards";
    }
    if (/kortit/.test(text))
        return "cards";
    if (/palapeli/.test(text))
        return "puzzle";
    if (/kakku|kuppi/.test(text))
        return "cake";
    if (/uuni|paista/.test(text))
        return "oven";
    if (/tarjoile/.test(text))
        return "serve";
    if (/tyhjennä|poista|kumoa/.test(text))
        return "undo";
    if (/mansikka|marja|mustikka/.test(text))
        return "berry";
    if (/sitruuna/.test(text))
        return "sun";
    if (/kukka|puutarha/.test(text))
        return "flower";
    if (/kynä|piirrä/.test(text))
        return "brush";
    if (/juhli|valmis|seuraava|piilota|etsi|aloita/.test(text))
        return "next";
    return "paw";
}
export function button(label, fn, cls = "tool") {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls + " cursor-interaction";
    if ((cls.includes("tool") || cls.includes("primary")) && label)
        iconButton(b, iconForLabel(label), label);
    else
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
    if (friends.some((friend) => friend.id === art)) {
        return ('<span class="picture" data-cast="' + art + '" aria-hidden="true"></span>');
    }
    return ('<span class="picture" data-art="' + art + '" aria-hidden="true"></span>');
}
export function cat() {
    return '<span class="cat-back" aria-hidden="true"><span class="cat-eyes"></span><span class="cat-nose"></span></span>';
}
export function heading(art, title, instruction, room) {
    const portrait = el("portrait");
    portrait.classList.remove("find-clue", "find-reveal");
    portrait.style.removeProperty("--clue-x");
    portrait.style.removeProperty("--clue-y");
    portrait.style.removeProperty("background-size");
    portrait.dataset.art = art;
    if (friends.some((friend) => friend.id === art))
        portrait.dataset.cast = art;
    else
        delete portrait.dataset.cast;
    el("play").dataset.room = art;
    portrait.setAttribute("aria-label", friends.find((f) => f.id === art)?.name ?? "Gabbyn ystävä");
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
let advanceTimer;
export function cancelAdvance() {
    if (advanceTimer !== undefined)
        clearTimeout(advanceTimer);
    advanceTimer = undefined;
}
export function advanceAfterSuccess() {
    cancelAdvance();
    const action = state.action;
    if (!action)
        return;
    advanceTimer = setTimeout(() => {
        advanceTimer = undefined;
        if (state.action !== action || el("play").hidden)
            return;
        state.action = null;
        action();
    }, 3500);
}
export function setAction(label, fn) {
    cancelAdvance();
    if (label)
        iconButton(el("action"), iconForLabel(label), label);
    else {
        el("action").replaceChildren();
        el("action").removeAttribute("aria-label");
    }
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
    const winArt = el("win-art");
    winArt.dataset.art = art;
    if (friends.some((friend) => friend.id === art))
        winArt.dataset.cast = art;
    else
        delete winArt.dataset.cast;
    el("win-art").classList.remove("pop");
    void el("win-art").offsetWidth;
    el("win-art").classList.add("pop");
    ding();
    say(title + " " + text);
}

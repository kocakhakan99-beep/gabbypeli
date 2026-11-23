import { advanceAfterSuccess } from "../ui.js";
import { playObjects } from "../play-objects.js";
import { button, cat, feedback, finish, heading, picture, progress, setAction, } from "../ui.js";
import { ding, say, unlock } from "../audio.js";
import { el } from "../dom.js";
import { shuffle } from "../utils.js";
import { state } from "../state.js";
let memoryView;
let memoryGeneration = 0;
let memoryViewLoading = false;
let pack = "friends";
let previewTimer;
let mismatchTimer;
let closeTimer;
const memoryFriends = [
    { id: "gabby", name: "Gabby" },
    { id: "pandy", name: "Pandi Pörrö" },
    { id: "cakey", name: "Hile" },
    { id: "mercat", name: "Merikatti" },
    { id: "fairy", name: "Kisukeiju" },
    { id: "dj", name: "DJ Catnip" },
];
export function stopMemoryTimers() {
    memoryGeneration++;
    memoryView?.destroy();
    memoryView = undefined;
    memoryViewLoading = false;
    clearTimeout(previewTimer);
    clearTimeout(mismatchTimer);
    clearTimeout(closeTimer);
    previewTimer = mismatchTimer = closeTimer = undefined;
}
function hidePreview(announce = true) {
    if (!state.preview)
        return;
    clearTimeout(previewTimer);
    previewTimer = undefined;
    state.preview = false;
    setAction("", null);
    drawCards();
    feedback("Etsi kaksi samanlaista kuvaa.");
    if (announce)
        say("Käännä kaksi korttia. Missä on samanlainen kaveri?");
}
export function initMemory() {
    stopMemoryTimers();
    heading("cakey", pack === "friends"
        ? "Etsi kaveriparit"
        : pack === "mixed"
            ? "Etsi kuvaparit"
            : "Etsi esineparit", "Katso kuvia hetki. Kortit kääntyvät itsestään.", "Ystävien muistileikki");
    state.matched = 0;
    state.opened = [];
    state.waiting = false;
    state.preview = true;
    const deck = pack === "friends"
        ? memoryFriends
        : pack === "objects"
            ? playObjects
            : [...memoryFriends, ...playObjects];
    state.mem = shuffle(shuffle(deck)
        .slice(0, state.memoryPairs)
        .flatMap((f) => [
        { friend: f, found: false },
        { friend: f, found: false },
    ]));
    const packSettings = el("memory-packs");
    packSettings.replaceChildren();
    for (const [key, label] of [
        ["friends", "Kaverit"],
        ["objects", "Esineet"],
        ["mixed", "Kaverit ja esineet"],
    ]) {
        const choice = button(label, () => {
            pack = key;
            if (key === "friends")
                state.memoryPairs = Math.min(state.memoryPairs, 6);
            initMemory();
        });
        choice.setAttribute("aria-pressed", String(pack === key));
        packSettings.append(choice);
    }
    el("memory-settings").replaceChildren();
    const levels = pack === "friends" ? [2, 3, 4, 5, 6] : [2, 3, 4, 5, 6, 7, 8, 9];
    levels.forEach((n) => {
        const b = button(n + " paria", () => {
            state.memoryPairs = n;
            initMemory();
        });
        if (n > 6)
            b.textContent = String(n);
        b.setAttribute("aria-pressed", String(n === state.memoryPairs));
        el("memory-settings").append(b);
    });
    el("cards").replaceChildren();
    drawCards();
    progress(0, state.memoryPairs);
    feedback("Katso kuvat rauhassa.");
    setAction("Piilota kortit", () => hidePreview());
    previewTimer = setTimeout(() => hidePreview(), 5200);
    if (pack === "friends")
        say("Katsotaan kaverien paikat yhdessä.");
}
export function drawCards() {
    if (!memoryView && !memoryViewLoading) {
        memoryViewLoading = true;
        const generation = memoryGeneration;
        const art = state.mem.map(({ friend }) => ({
            id: friend.id,
            folder: memoryFriends.some((item) => item.id === friend.id) ? "friends" : "objects",
        }));
        void import("../phaser-room.js").then(({ createTileView }) => {
            if (generation !== memoryGeneration)
                return;
            memoryView = createTileView(el("memory"), "memory", art, 1, (_action, index) => flip(index));
            memoryViewLoading = false;
        }).catch(() => { if (generation === memoryGeneration)
            memoryViewLoading = false; });
    }
    el("cards").className =
        "memory " +
            (state.memoryPairs === 2
                ? "four"
                : state.memoryPairs === 3
                    ? "six"
                    : state.memoryPairs === 4
                        ? "eight"
                        : "twelve");
    state.mem.forEach((m, i) => {
        const up = state.preview || m.found || state.opened.includes(i);
        const b = el("cards").querySelector(`[data-index="${i}"]`) ?? button("", () => { if (!memoryView?.activate("flip", i))
            flip(i); }, "memory-card" + (m.found ? " matched" : up ? " faceup" : ""));
        b.className = "memory-card" + (m.found ? " matched" : up ? " faceup" : "");
        const front = pack === "friends"
            ? '<span class="picture" data-cast="' +
                m.friend.id +
                '" aria-hidden="true"></span>'
            : picture(m.friend.id);
        b.innerHTML =
            '<span class="memory-inner"><span class="memory-side memory-back">' +
                cat() +
                '</span><span class="memory-side memory-front">' +
                front +
                "</span></span>";
        b.setAttribute("aria-label", "Kortti " +
            (i + 1) +
            ": " +
            (up
                ? m.friend.name + (m.found ? ", pari löytyi" : "")
                : "kuvapuoli piilossa"));
        b.setAttribute("aria-pressed", String(up));
        b.disabled = m.found || state.preview;
        b.dataset.index = String(i);
        if (!b.isConnected)
            el("cards").append(b);
    });
}
export function flip(i) {
    if (state.preview)
        hidePreview(false);
    if (state.waiting || state.mem[i].found || state.opened.includes(i))
        return;
    unlock();
    state.opened.push(i);
    drawCards();
    if (state.opened.length === 1) {
        if (pack === "friends")
            say(state.mem[i].friend.name + ". Etsi samanlainen kuva.");
        else {
            feedback("Etsi toinen samanlainen kuva.");
            say("Etsi toinen samanlainen kuva.");
        }
        return;
    }
    const [a, b] = state.opened;
    if (state.mem[a].friend.id === state.mem[b].friend.id) {
        state.mem[a].found = state.mem[b].found = true;
        state.matched++;
        state.opened = [];
        drawCards();
        progress(state.matched, state.memoryPairs);
        ding("pair");
        if (state.matched === state.memoryPairs) {
            feedback("Kaikki parit löytyivät!");
            setAction("Juhlitaan!", () => finish(pack === "friends"
                ? "Kaikki kaverit löytyivät!"
                : "Kaikki esineparit löytyivät!", "Gabby ja Pandi Pörrö taputtavat sinulle. Hienoa muistamista!", "gabby"));
            say("Kaikki parit löytyivät! Hienoa!");
            advanceAfterSuccess();
        }
        else {
            feedback("Pari löytyi! Etsi seuraava.");
            say("Pari löytyi! Etsi seuraava.");
        }
    }
    else {
        state.waiting = true;
        feedback("Kaksi eri kuvaa. Katsotaan rauhassa.");
        setAction("", null);
        if (pack === "friends")
            say("Nämä ovat eri kaverit. Katso kuvia rauhassa. Käännetään sitten takaisin.");
        mismatchTimer = setTimeout(() => {
            if (state.mode !== "memory" || !state.waiting)
                return;
            state.opened.forEach((index) => {
                el("cards")
                    .querySelector(`[data-index="${index}"]`)
                    ?.classList.add("closing");
            });
            closeTimer = setTimeout(() => {
                if (state.mode !== "memory" || !state.waiting)
                    return;
                state.opened = [];
                state.waiting = false;
                drawCards();
                feedback("Etsi kaksi samanlaista kuvaa.");
                if (pack === "friends")
                    say("Kokeillaan uudestaan. Etsi samanlaiset kuvat.");
            }, 420);
        }, 1450);
    }
}
export function showMemoryHint() {
    if (state.matched === state.memoryPairs)
        return;
    stopMemoryTimers();
    state.preview = true;
    state.waiting = false;
    state.opened = [];
    drawCards();
    feedback("Katso kuvien paikat rauhassa.");
    say(pack === "friends"
        ? "Katsotaan kaverien paikat yhdessä."
        : "Katsotaan esineiden paikat yhdessä.");
    setAction("Piilota kortit", () => hidePreview());
    previewTimer = setTimeout(() => hidePreview(), 5200);
}

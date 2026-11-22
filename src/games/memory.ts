import { advanceAfterSuccess } from "../ui.js";
import { playObjects } from "../play-objects.js";
import {
  button,
  cat,
  feedback,
  finish,
  heading,
  picture,
  progress,
  setAction,
} from "../ui.js";
import { ding, say, unlock } from "../audio.js";
import { el } from "../dom.js";
import { shuffle } from "../utils.js";
import { state } from "../state.js";

let pack: "friends" | "objects" = "friends";
let previewTimer: ReturnType<typeof setTimeout> | undefined;
let mismatchTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

const memoryFriends = [
  { id: "gabby", name: "Gabby" },
  { id: "pandy", name: "Pandi Pörrö" },
  { id: "cakey", name: "Hile" },
  { id: "mercat", name: "Merikatti" },
  { id: "fairy", name: "Kisukeiju" },
  { id: "dj", name: "DJ Catnip" },
];

export function stopMemoryTimers(): void {
  clearTimeout(previewTimer);
  clearTimeout(mismatchTimer);
  clearTimeout(closeTimer);
  previewTimer = mismatchTimer = closeTimer = undefined;
}

function hidePreview(announce = true): void {
  if (!state.preview) return;
  clearTimeout(previewTimer);
  previewTimer = undefined;
  state.preview = false;
  setAction("", null);
  drawCards();
  feedback("Etsi kaksi samanlaista kuvaa.");
  if (announce) say("Käännä kaksi korttia. Missä on samanlainen kaveri?");
}

export function initMemory() {
  stopMemoryTimers();
  heading(
    "cakey",
    pack === "friends" ? "Etsi kaveriparit" : "Etsi esineparit",
    "Katso kuvia hetki. Kortit kääntyvät itsestään.",
    "Ystävien muistileikki",
  );
  state.matched = 0;
  state.opened = [];
  state.waiting = false;
  state.preview = true;
  state.mem = shuffle(
    (pack === "friends" ? shuffle(memoryFriends) : shuffle(playObjects))
      .slice(0, state.memoryPairs)
      .flatMap((f) => [
        { friend: f, found: false },
        { friend: f, found: false },
      ]),
  );
  const packSettings = el("memory-packs");
  packSettings.replaceChildren();
  for (const [key, label] of [
    ["friends", "Kaverit"],
    ["objects", "Esineet"],
  ] as const) {
    const choice = button(label, () => {
      pack = key;
      initMemory();
    });
    choice.setAttribute("aria-pressed", String(pack === key));
    packSettings.append(choice);
  }
  el("memory-settings").replaceChildren();
  [2, 3, 4].forEach((n) => {
    const b = button(n + " paria", () => {
      state.memoryPairs = n;
      initMemory();
    });
    b.setAttribute("aria-pressed", String(n === state.memoryPairs));
    el("memory-settings").append(b);
  });
  drawCards();
  progress(0, state.memoryPairs);
  feedback("Katso kuvat rauhassa.");
  setAction("Piilota kortit", () => hidePreview());
  previewTimer = setTimeout(() => hidePreview(), 5200);
  if (pack === "friends") say("Katsotaan kaverien paikat yhdessä.");
}

export function drawCards() {
  el("cards").className =
    "memory " +
    (state.memoryPairs === 2
      ? "four"
      : state.memoryPairs === 3
        ? "six"
        : "eight");
  el("cards").replaceChildren();
  state.mem.forEach((m, i) => {
    const up = state.preview || m.found || state.opened.includes(i);
    const b = button(
      "",
      () => flip(i),
      "memory-card" + (m.found ? " matched" : up ? " faceup" : ""),
    );
    const front =
      pack === "friends"
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
    b.setAttribute(
      "aria-label",
      "Kortti " +
        (i + 1) +
        ": " +
        (up
          ? m.friend.name + (m.found ? ", pari löytyi" : "")
          : "kuvapuoli piilossa"),
    );
    b.setAttribute("aria-pressed", String(up));
    b.disabled = m.found || state.preview;
    b.dataset.index = String(i);
    el("cards").append(b);
  });
}

export function flip(i: number) {
  if (state.preview) hidePreview(false);
  if (state.waiting || state.mem[i].found || state.opened.includes(i)) return;
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
      setAction("Juhlitaan!", () =>
        finish(
          pack === "friends"
            ? "Kaikki kaverit löytyivät!"
            : "Kaikki esineparit löytyivät!",
          "Gabby ja Pandi Pörrö taputtavat sinulle. Hienoa muistamista!",
          "gabby",
        ),
      );
      say("Kaikki parit löytyivät! Hienoa!");
      advanceAfterSuccess();
    } else {
      feedback("Pari löytyi! Etsi seuraava.");
      say("Pari löytyi! Etsi seuraava.");
    }
  } else {
    state.waiting = true;
    feedback("Kaksi eri kuvaa. Katsotaan rauhassa.");
    setAction("", null);
    if (pack === "friends")
      say(
        "Nämä ovat eri kaverit. Katso kuvia rauhassa. Käännetään sitten takaisin.",
      );
    mismatchTimer = setTimeout(() => {
      if (state.mode !== "memory" || !state.waiting) return;
      state.opened.forEach((index) => {
        el("cards")
          .querySelector(`[data-index="${index}"]`)
          ?.classList.add("closing");
      });
      closeTimer = setTimeout(() => {
        if (state.mode !== "memory" || !state.waiting) return;
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
  if (state.matched === state.memoryPairs) return;
  stopMemoryTimers();
  state.preview = true;
  state.waiting = false;
  state.opened = [];
  drawCards();
  feedback("Katso kuvien paikat rauhassa.");
  say(
    pack === "friends"
      ? "Katsotaan kaverien paikat yhdessä."
      : "Katsotaan esineiden paikat yhdessä.",
  );
  setAction("Piilota kortit", () => hidePreview());
  previewTimer = setTimeout(() => hidePreview(), 5200);
}

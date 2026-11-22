import type { GameMode } from "./types.js";
import { el } from "./dom.js";
import { feedback, setAction } from "./ui.js";
import { initMemory } from "./games/memory.js";
import { initPuzzle, stopPuzzleDrag } from "./games/puzzle.js";
import { renderFind } from "./games/find.js";
import { renderLearn } from "./games/learning.js";
import { renderSizes } from "./games/sizes.js";
import { startBaking, stopBakingGestures } from "./games/baking.js";
import { startBubbles } from "./games/bubbles.js";
import { state } from "./state.js";
import { stopSpeech, silenceEffects, unlock } from "./audio.js";

import { startDrawing } from "./games/drawing.js";
import { startGarden } from "./games/garden.js";
import { stopStroke } from "./games/stroke.js";

function stopGestures(): void {
  stopBakingGestures();
  stopPuzzleDrag();
  stopStroke(el("drawing-paper"));
  stopStroke(el("garden-field"));
}

const starters: Record<GameMode, () => void> = {
  memory: initMemory,
  puzzle: initPuzzle,
  find: renderFind,
  learn: renderLearn,
  sizes: renderSizes,
  baking: startBaking,
  bubbles: startBubbles,
  drawing: startDrawing,
  garden: startGarden,
};

export function home(): void {
  stopGestures();
  stopSpeech();
  silenceEffects();
  state.currentPrompt = "Tervetuloa Gabbyn nukketaloon! Valitse leikki.";
  state.mode = "";
  state.action = null;
  el("home").hidden = false;
  el("play").hidden = true;
}

export function open(which: GameMode): void {
  stopGestures();
  stopSpeech();
  silenceEffects();
  unlock();
  el("portrait").style.backgroundSize = "";
  el("portrait").style.backgroundPosition = "";
  state.mode = which;
  state.learnIndex = 0;
  el("hint").hidden = !["memory", "puzzle"].includes(which);
  el("home").hidden = true;
  el("play").hidden = false;
  el("win").hidden = true;
  el("content").hidden = false;
  for (const panel of [
    "memory",
    "puzzle",
    "learn",
    "baking",
    "bubbles",
    "drawing",
    "garden",
  ] as const) {
    el(panel).hidden = panel !== which;
  }
  el("learn").hidden = !["find", "learn", "sizes"].includes(which);
  feedback("");
  setAction("", null);
  starters[which]();
}

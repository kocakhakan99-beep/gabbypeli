import { loadDOMAtlas } from "./dom-atlases.js";
import { startFreePlayClock, stopFreePlayClock } from "./free-play-clock.js";
import { campaignLevel, setCampaignLevel } from "./campaign.js";
import type { GameMode } from "./types.js";
import { el } from "./dom.js";
import { cancelAdvance, feedback, setAction } from "./ui.js";
import { initMemory, stopMemoryTimers } from "./games/memory.js";
import { initPuzzle, stopPuzzleDrag } from "./games/puzzle.js";
import { startFind, stopFind } from "./games/find.js";
import { renderLearn } from "./games/learning.js";
import { renderSizes, stopSizeGestures } from "./games/sizes.js";
import { startBaking, stopBakingGestures } from "./games/baking.js";
import { startBubbles } from "./games/bubbles.js";
import { state } from "./state.js";
import { stopSpeech, silenceEffects, unlock } from "./audio.js";

import { startDrawing, stopDrawing } from "./games/drawing.js";
import { startGarden, stopGarden } from "./games/garden.js";
import { enableSceneStrokes, sceneStrokeHandlers, sceneStrokeTarget, stopStroke } from "./games/stroke.js";

let inputStarted = false;
let cancelRoomInput: (() => void) | undefined;

function stopGestures(): void {
  cancelRoomInput?.();
  stopGarden();
  stopFind();
  stopMemoryTimers();
  stopStroke(el("portrait"));
  stopBakingGestures();
  stopPuzzleDrag();
  stopSizeGestures();
  stopStroke(el("bubble-field"));
  stopDrawing();
  stopStroke(el("garden-field"));
}

const starters: Record<GameMode, () => void> = {
  memory: initMemory,
  puzzle: initPuzzle,
  find: startFind,
  learn: renderLearn,
  sizes: renderSizes,
  baking: startBaking,
  bubbles: startBubbles,
  drawing: startDrawing,
  garden: startGarden,
};

export function home(): void {
  stopFreePlayClock();
  setCampaignLevel();
  const previousRoom = state.mode;
  cancelAdvance();
  stopGestures();
  stopSpeech();
  silenceEffects();
  state.currentPrompt = "Tervetuloa Gabbyn nukketaloon! Valitse leikki.";
  state.mode = "";
  state.action = null;
  el("home").hidden = false;
  el("play").hidden = true;
  if (previousRoom) el(`open-${previousRoom}`).focus();
}

export function open(which: GameMode, level?: number): void {
  stopFreePlayClock();
  if (which === "memory" || which === "puzzle" || which === "find" || which === "garden" || which === "baking") setCampaignLevel(level, which);
  else setCampaignLevel();
  cancelAdvance();
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
  const expired = document.querySelector<HTMLElement>("#gf-free-expired")!;
  expired.hidden = true;
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
  if (!inputStarted && ["memory", "puzzle", "find", "garden", "baking"].includes(which)) {
    inputStarted = true;
    const target = el("play");
    void import("./phaser-room.js").then(({ startRoomInput }) => {
      cancelRoomInput = startRoomInput(target, {
        ready: () => {
          enableSceneStrokes(target);
          target.dataset.input = "phaser";
        },
        find: sceneStrokeTarget,
        handlers: sceneStrokeHandlers,
      });
    }).catch(() => { inputStarted = false; });
  }
  if (campaignLevel() === undefined && (which === "memory" || which === "puzzle")) {
    void loadDOMAtlas("controls");
  }
  if (which === "garden") void loadDOMAtlas("garden");
  starters[which]();
  if (campaignLevel() === undefined) {
    startFreePlayClock(() => {
      cancelAdvance();
      setAction("", null);
      stopGestures();
      stopSpeech();
      silenceEffects();
      el("content").hidden = true;
      el("hint").hidden = true;
      expired.hidden = false;
      document.querySelector<HTMLElement>("#gf-free-expired-title")!.focus();
    });
  }
  el("title").focus();
  el("play").scrollIntoView({ block: "start" });
}

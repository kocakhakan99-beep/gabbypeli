import { setCampaignLevel } from "./campaign.js";
import { el } from "./dom.js";
import { cancelAdvance, feedback, setAction } from "./ui.js";
import { initMemory, stopMemoryTimers } from "./games/memory.js";
import { initPuzzle, stopPuzzleDrag } from "./games/puzzle.js";
import { renderFind, stopFind } from "./games/find.js";
import { renderLearn } from "./games/learning.js";
import { renderSizes, stopSizeGestures } from "./games/sizes.js";
import { startBaking, stopBakingGestures } from "./games/baking.js";
import { startBubbles } from "./games/bubbles.js";
import { state } from "./state.js";
import { stopSpeech, silenceEffects, unlock } from "./audio.js";
import { startGarden, stopGarden } from "./games/garden.js";
import { enableSceneStrokes, sceneStrokeHandlers, sceneStrokeTarget, stopStroke } from "./games/stroke.js";
let inputStarted = false;
let cancelRoomInput;
function stopGestures() {
    cancelRoomInput?.();
    stopGarden();
    stopFind();
    stopMemoryTimers();
    stopStroke(el("portrait"));
    stopBakingGestures();
    stopPuzzleDrag();
    stopSizeGestures();
    stopStroke(el("bubble-field"));
    stopStroke(el("drawing-paper"));
    stopStroke(el("garden-field"));
}
const starters = {
    memory: initMemory,
    puzzle: initPuzzle,
    find: renderFind,
    learn: renderLearn,
    sizes: renderSizes,
    baking: startBaking,
    bubbles: startBubbles,
    drawing: home,
    garden: startGarden,
};
export function home() {
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
    if (previousRoom)
        el(`open-${previousRoom}`).focus();
}
export function open(which, level) {
    if (which === "memory" || which === "puzzle" || which === "find" || which === "garden" || which === "baking")
        setCampaignLevel(level, which);
    else
        setCampaignLevel();
    if (which === "drawing") {
        home();
        return;
    }
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
    el("content").hidden = false;
    for (const panel of [
        "memory",
        "puzzle",
        "learn",
        "baking",
        "bubbles",
        "drawing",
        "garden",
    ]) {
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
    starters[which]();
    el("title").focus();
    el("play").scrollIntoView({ block: "start" });
}

import { campaignGames, campaignLevel, renderCampaign, type CampaignGame } from "./campaign.js";
import { cancelAdvance, iconButton } from "./ui.js";
import { showMemoryHint } from "./games/memory.js";
import { showPuzzleHint } from "./games/puzzle.js";
import { el } from "./dom.js";
import { home, open } from "./navigation.js";
import {
  ding,
  loadNarration,
  say,
  silenceEffects,
  stopSpeech,
  unlock,
} from "./audio.js";
import { state } from "./state.js";
import {
  initStickerAlbum,
  renderStickers,
  savedProgress,
  saveProgress,
} from "./storage.js";

void loadNarration();
renderStickers();
initStickerAlbum();

iconButton(el("home-button"), "home", "Takaisin nukketaloon");
iconButton(el("hint"), "hint", "Näytä vihje");
iconButton(el("repeat"), "voice", "Kuuntele Gabbyn ohje uudelleen");
iconButton(el("again"), "replay", "Leiki uudestaan");
iconButton(el("other"), "home", "Takaisin nukketaloon");
iconButton(el("sound"), "voice", "Äänet päällä");
iconButton(el("drawing-brush"), "brush", "Paksu kynä");
iconButton(el("drawing-stamp"), "paw", "Tassuleimasin");
iconButton(el("drawing-undo"), "undo", "Kumoa viimeisin piirto");
const stickerUndo =
  document.querySelector<HTMLButtonElement>("#gf-sticker-undo");
if (stickerUndo) iconButton(stickerUndo, "undo", "Poista viimeisin tarra");
for (const mode of [
  "memory",
  "puzzle",
  "learn",
  "find",
  "sizes",
  "baking",
  "bubbles",
  "drawing",
  "garden",
] as const) {
  el(`open-${mode}`).addEventListener("click", () => open(mode));
}
let mapGame: CampaignGame = "memory";
function updateMap(): void {
  renderCampaign(mapGame, (level) => open(mapGame, level));
  for (const game of campaignGames) {
    document.querySelector(`#gf-map-${game}`)!.setAttribute("aria-pressed", String(mapGame === game));
  }
}
for (const game of campaignGames) {
  document.querySelector(`#gf-map-${game}`)!.addEventListener("click", () => {
    mapGame = game;
    updateMap();
  });
}
function showMap(show: boolean): void {
  document.querySelector<HTMLElement>("#gf-campaign-map")!.hidden = !show;
  document.querySelector<HTMLElement>("#gf-free-games")!.hidden = show;
  document.querySelector("#gf-campaign-toggle")!.setAttribute("aria-expanded", String(show));
  updateMap();
}
document.querySelector("#gf-campaign-toggle")!.addEventListener("click", () => showMap(true));
document.querySelector("#gf-free-toggle")!.addEventListener("click", () => showMap(false));
document.querySelector("#gf-next-level")!.addEventListener("click", () => {
  const level = campaignLevel();
  if (level !== undefined) open(mapGame, level + 1);
});
function exitGame(): void {
  const adventure = campaignLevel() !== undefined;
  home();
  showMap(adventure);
  if (adventure) document.querySelector<HTMLElement>("#gf-campaign-toggle")!.focus();
}
el("home-button").addEventListener("click", exitGame);
el("other").addEventListener("click", exitGame);
updateMap();
el("action").addEventListener("click", () => {
  cancelAdvance();
  const action = state.action;
  state.action = null;
  action?.();
});
el("again").addEventListener("click", () => {
  if (state.mode) open(state.mode, campaignLevel());
});
el("repeat").addEventListener("click", () => {
  unlock();
  if (el("win").hidden) el("feedback").textContent = state.currentPrompt;
  say(state.currentPrompt);
});
el("hint").addEventListener("click", () => {
  if (state.mode === "memory") showMemoryHint();
  if (state.mode === "puzzle") showPuzzleHint();
});

el("sound").addEventListener("click", () => {
  state.sound = !state.sound;
  iconButton(
    el("sound"),
    state.sound ? "voice" : "mute",
    state.sound ? "Äänet päällä" : "Äänet pois",
  );
  el("sound").setAttribute("aria-pressed", String(state.sound));
  if (state.sound) {
    unlock();
    say(state.currentPrompt || "Tervetuloa Gabbyn nukketaloon!");
  } else {
    stopSpeech();
    silenceEffects();
  }
});

el("settings-toggle").addEventListener("click", () => {
  const expanded = el("settings").hidden;
  el("settings").hidden = !expanded;
  el("settings-toggle").setAttribute("aria-expanded", String(expanded));
});
el("speech-enabled").checked = savedProgress.preferences.speech;
el("effects-enabled").checked = savedProgress.preferences.effects;
el("volume").value = String(Math.round(savedProgress.preferences.volume * 100));
el("speech-enabled").addEventListener("change", () => {
  savedProgress.preferences.speech = el("speech-enabled").checked;
  stopSpeech();
  saveProgress();
});
el("effects-enabled").addEventListener("change", () => {
  savedProgress.preferences.effects = el("effects-enabled").checked;
  if (!savedProgress.preferences.effects) silenceEffects();
  saveProgress();
});
el("volume").addEventListener("input", () => {
  savedProgress.preferences.volume = Number(el("volume").value) / 100;
  saveProgress();
});
el("audio-test").addEventListener("click", () => {
  state.sound = true;
  iconButton(el("sound"), "voice", "Äänet päällä");
  el("sound").setAttribute("aria-pressed", "true");
  unlock();
  ding("sprinkle");
  say("Hei pieni ystävä! Leikitään yhdessä.");
});

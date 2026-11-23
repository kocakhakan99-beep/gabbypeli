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
el("again").textContent = "Pelaa uudelleen";
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
  el(`open-${mode}`).addEventListener("click", () => {
    if (selectedMode === "campaign" && campaignGames.some((game) => game === mode)) {
      mapGame = mode as CampaignGame;
      showDestination("campaign");
      document.querySelector<HTMLElement>("#gf-campaign-resume:not([hidden]), #gf-levels button:not(:disabled)")?.focus();
    } else open(mode);
  });
}
let mapGame: CampaignGame = "memory";
let selectedMode: "campaign" | "free" = "free";
function updateMap(): void {
  renderCampaign(mapGame, (level) => open(mapGame, level));
  const names: Record<CampaignGame, string> = { memory: "Muistipeli", puzzle: "Palapeli", find: "Piilopeli", garden: "Kisukeijun puutarha", baking: "Hileen leipomo" };
  document.querySelector("#gf-map-title")!.textContent = names[mapGame] + " – Seikkailu";
}
type Destination = "home" | "campaign" | "free" | "stickers";
const navigation = document.querySelectorAll<HTMLButtonElement>(".dollhouse-nav button");
const mapPanel = document.querySelector<HTMLElement>("#gf-campaign-map")!;
const roomPanel = document.querySelector<HTMLElement>("#gf-free-games")!;
const stickerPanel = document.querySelector<HTMLElement>("#gf-sticker-book")!;

function showDestination(destination: Destination): void {
  el("home").dataset.destination = destination;
  el("home").dataset.mode = selectedMode;
  mapPanel.hidden = destination !== "campaign";
  mapPanel.parentElement!.hidden = mapPanel.hidden;
  roomPanel.hidden = destination !== "home" && destination !== "free";
  stickerPanel.hidden = destination !== "stickers";
  document.querySelector("#gf-campaign-toggle")!.setAttribute("aria-expanded", String(selectedMode === "campaign"));
  document.querySelector("#gf-free-toggle")!.setAttribute("aria-pressed", String(selectedMode === "free"));
  for (const button of navigation)
    button.setAttribute("aria-pressed", String(button.dataset.destination === destination));
  updateMap();
}

for (const button of navigation) {
  if (button.disabled) continue;
  button.addEventListener("click", () => showDestination(button.dataset.destination as Destination));
}
document.querySelector("#gf-campaign-toggle")!.addEventListener("click", () => {
  selectedMode = "campaign";
  showDestination("home");
  roomPanel.querySelector<HTMLElement>("button:not([hidden])")?.focus();
});
document.querySelector("#gf-free-toggle")!.addEventListener("click", () => {
  selectedMode = "free";
  showDestination("free");
  roomPanel.querySelector<HTMLElement>("button:not([hidden])")?.focus();
});
document.querySelector("#gf-map-back")!.addEventListener("click", () => {
  selectedMode = "campaign";
  showDestination("home");
  document.querySelector<HTMLElement>(`#gf-open-${mapGame}`)?.focus();
});
document.querySelector("#gf-next-level")!.addEventListener("click", () => {
  const level = campaignLevel();
  if (level !== undefined) open(mapGame, level + 1);
});
function exitGame(): void {
  const adventure = campaignLevel() !== undefined;
  selectedMode = adventure ? "campaign" : "free";
  home();
  showDestination(adventure ? "campaign" : "free");
  if (adventure) {
    const next = document.querySelector<HTMLElement>('#gf-levels [aria-current="step"]');
    (next ?? document.querySelector<HTMLElement>("#gf-map-back"))?.focus();
  }
}
el("home-button").addEventListener("click", exitGame);
el("other").addEventListener("click", exitGame);
showDestination("home");
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

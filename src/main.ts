import { showMemoryHint } from "./games/memory.js";
import { showPuzzleHint } from "./games/puzzle.js";
import { addCake, checkRecipe, resetPlate } from "./games/baking.js";
import { el } from "./dom.js";
import { home, open } from "./navigation.js";
import {
  ding,
  loadNarration,
  say,
  silenceEffects,
  stopSpeech,
  unlock,
  voices,
  updateVoiceStatus,
} from "./audio.js";
import { state } from "./state.js";
import { renderStickers, savedProgress, saveProgress } from "./storage.js";

function listVoices(): void {
  const available = voices();
  el("voice").replaceChildren(new Option("Laitteen oletus", ""));
  for (const voice of available)
    el("voice").append(new Option(voice.name, voice.voiceURI));
  el("voice").value = savedProgress.preferences.voice;
  updateVoiceStatus();
}

listVoices();
try {
  window.speechSynthesis.addEventListener("voiceschanged", listVoices);
} catch {
  /* Optional API. */
}
void loadNarration();
renderStickers();

for (const mode of [
  "memory",
  "puzzle",
  "learn",
  "find",
  "sizes",
  "baking",
  "bubbles",
] as const) {
  el(`open-${mode}`).addEventListener("click", () => open(mode));
}
el("home-button").addEventListener("click", home);
el("other").addEventListener("click", home);
el("action").addEventListener("click", () => state.action?.());
el("again").addEventListener("click", () => {
  if (state.mode) open(state.mode);
});
el("repeat").addEventListener("click", () => {
  unlock();
  say(state.currentPrompt);
});
el("hint").addEventListener("click", () => {
  if (state.mode === "memory") showMemoryHint();
  if (state.mode === "puzzle") showPuzzleHint();
});
el("baking-add").addEventListener("click", addCake);
el("baking-check").addEventListener("click", checkRecipe);
el("baking-reset").addEventListener("click", resetPlate);

el("sound").addEventListener("click", () => {
  state.sound = !state.sound;
  el("sound").setAttribute("aria-pressed", String(state.sound));
  el("sound").textContent = state.sound ? "Äänet päällä" : "Äänet pois";
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
  if (expanded) listVoices();
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
el("voice").addEventListener("change", () => {
  savedProgress.preferences.voice = el("voice").value;
  voices();
  stopSpeech();
  saveProgress();
  updateVoiceStatus();
});
el("audio-test").addEventListener("click", () => {
  state.sound = true;
  el("sound").textContent = "Äänet päällä";
  el("sound").setAttribute("aria-pressed", "true");
  unlock();
  ding("sprinkle");
  say("Hei pieni ystävä! Leikitään yhdessä.");
});

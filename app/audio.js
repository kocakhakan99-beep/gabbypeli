import { state } from "./state.js";
import { savedProgress } from "./storage.js";
const activeTones = new Set();
let recording = null;
let speechVersion = 0;
let clips = {};
const clipRoot = new URL("../assets/audio/", import.meta.url);
export async function loadNarration() {
    try {
        const response = await fetch(new URL("manifest.json", clipRoot));
        if (!response.ok)
            return;
        const data = await response.json();
        if (data && typeof data === "object") {
            for (const [text, filename] of Object.entries(data)) {
                if (typeof filename === "string" && /^[a-z0-9-]+\.mp3$/.test(filename))
                    clips[text] = filename;
            }
        }
    }
    catch {
        /* Device speech remains available when recordings cannot load. */
    }
    updateVoiceStatus();
}
export function voices() {
    try {
        const available = window.speechSynthesis.getVoices();
        state.voice =
            available.find((voice) => voice.voiceURI === savedProgress.preferences.voice) ??
                available.find((voice) => voice.lang.toLowerCase().startsWith("fi")) ??
                null;
        return available.filter((voice) => voice.lang.toLowerCase().startsWith("fi"));
    }
    catch {
        return [];
    }
}
export function updateVoiceStatus() {
    const element = document.getElementById("gf-voice-status");
    if (element)
        element.textContent =
            Object.keys(clips).length > 0
                ? "Valmiit puheäänitteet käytössä. Muut ohjeet luetaan laitteen äänellä."
                : state.voice
                    ? "Laitteen puheääni: " + state.voice.name
                    : "Suomenkielistä puheääntä ei löytynyt. Aikuinen voi lukea ohjeet.";
}
export function stopSpeech() {
    speechVersion++;
    if (recording) {
        recording.pause();
        recording.removeAttribute("src");
        recording.load();
        recording = null;
    }
    try {
        window.speechSynthesis.cancel();
    }
    catch {
        /* Speech API is optional. */
    }
}
function deviceSpeech(text) {
    try {
        if (!window.speechSynthesis || !window.SpeechSynthesisUtterance)
            return;
        voices();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "fi-FI";
        if (state.voice)
            utterance.voice = state.voice;
        utterance.rate = 0.88;
        utterance.pitch = 1.08;
        utterance.volume = savedProgress.preferences.volume;
        window.speechSynthesis.speak(utterance);
    }
    catch {
        /* Text instructions are always visible. */
    }
}
export function say(text) {
    state.currentPrompt = text;
    stopSpeech();
    if (!state.sound || !savedProgress.preferences.speech)
        return;
    const filename = clips[text];
    if (!filename) {
        deviceSpeech(text);
        return;
    }
    const version = speechVersion;
    recording = new Audio(new URL(filename, clipRoot).href);
    recording.volume = savedProgress.preferences.volume;
    recording.play().catch(() => {
        if (version === speechVersion &&
            state.sound &&
            savedProgress.preferences.speech)
            deviceSpeech(text);
    });
}
export function unlock() {
    if (!state.sound || !savedProgress.preferences.effects)
        return;
    try {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!state.ctx && Context)
            state.ctx = new Context();
        if (state.ctx?.state === "suspended")
            void state.ctx.resume().catch(() => { });
    }
    catch {
        /* Browsers may require an additional user gesture. */
    }
}
const effects = {
    pair: [
        [460, 690, 0.17],
        [690, 920, 0.2],
    ],
    piece: [
        [740, 260, 0.09],
        [660, 880, 0.15],
    ],
    discovery: [
        [470, 680, 0.15],
        [690, 520, 0.19],
    ],
    bubble: [
        [420, 950, 0.09],
        [810, 420, 0.12],
    ],
    celebration: [
        [523, 523, 0.18],
        [659, 659, 0.18],
        [784, 784, 0.18],
        [1047, 1047, 0.29],
    ],
    sprinkle: [
        [920, 1380, 0.09],
        [1120, 1680, 0.09],
    ],
};
export function ding(effect = "celebration") {
    const audio = state.ctx;
    if (!state.sound || !savedProgress.preferences.effects || !audio)
        return;
    let start = audio.currentTime;
    for (const [from, to, duration] of effects[effect]) {
        const tone = audio.createOscillator();
        const envelope = audio.createGain();
        const end = start + duration;
        tone.frequency.setValueAtTime(from, start);
        tone.frequency.exponentialRampToValueAtTime(to, end);
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(0.07 * savedProgress.preferences.volume, start + 0.015);
        envelope.gain.exponentialRampToValueAtTime(0.001, end);
        tone.connect(envelope);
        envelope.connect(audio.destination);
        activeTones.add(tone);
        tone.onended = () => {
            activeTones.delete(tone);
            tone.disconnect();
            envelope.disconnect();
        };
        tone.start(start);
        tone.stop(end);
        start += duration * 0.75;
    }
}
export function silenceEffects() {
    activeTones.forEach((tone) => {
        try {
            tone.stop();
        }
        catch {
            /* Already ended. */
        }
    });
    activeTones.clear();
    if (state.ctx)
        void state.ctx.suspend().catch(() => { });
}

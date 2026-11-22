import { state } from "./state.js";
import { savedProgress } from "./storage.js";
const activeTones = new Set();
let recording = null;
const clips = Object.create(null);
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
        /* Written instructions remain available. */
    }
    updateVoiceStatus();
}
export function updateVoiceStatus() {
    const element = document.getElementById("gf-voice-status");
    if (element)
        element.textContent = Object.keys(clips).length
            ? "Valmiit puheäänitteet käytössä."
            : "Ohjeet näkyvät ruudulla.";
}
export function stopSpeech() {
    if (!recording)
        return;
    recording.pause();
    recording.removeAttribute("src");
    recording.load();
    recording = null;
}
export function say(text) {
    state.currentPrompt = text;
    stopSpeech();
    const filename = clips[text];
    if (!filename || !state.sound || !savedProgress.preferences.speech)
        return;
    recording = new Audio(new URL(filename, clipRoot).href);
    recording.volume = savedProgress.preferences.volume;
    void recording.play().catch(() => { });
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

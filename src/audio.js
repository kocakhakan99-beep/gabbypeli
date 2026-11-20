import { state } from "./state.js";

export function voices(){try{const vs=window.speechSynthesis.getVoices();state.voice=vs.find(v=>v.lang.toLowerCase().startsWith('fi'))||null;}catch{}}

export function say(text){state.currentPrompt=text;if(!state.sound)return;try{if(window.speechSynthesis&&window.SpeechSynthesisUtterance){voices();window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='fi-FI';if(state.voice)u.voice=state.voice;u.rate=.85;u.pitch=1.05;u.volume=.85;window.speechSynthesis.speak(u);}}catch{}}

export function unlock(){if(!state.sound)return;try{const C=window.AudioContext||window.webkitAudioContext;if(C&&!state.ctx)state.ctx=new C();if(state.ctx&&state.ctx.state==='suspended')state.ctx.resume().catch(()=>{});}catch{}}

// Each note gives a start pitch, end pitch, and duration in seconds.
const effects = {
  pair: [[460, 690, .17], [690, 920, .20]],
  piece: [[740, 260, .09], [660, 880, .15]],
  discovery: [[470, 680, .15], [690, 520, .19]],
  bubble: [[420, 950, .09], [810, 420, .12]],
  celebration: [[523, 523, .18], [659, 659, .18], [784, 784, .18], [1047, 1047, .29]],
};

export function ding(effect = 'celebration') {
  const audio = state.ctx;
  if (!state.sound || !audio) return;
  let start = audio.currentTime;
  for (const [from, to, duration] of effects[effect]) {
    const tone = audio.createOscillator();
    const envelope = audio.createGain();
    const end = start + duration;
    tone.frequency.setValueAtTime(from, start);
    tone.frequency.exponentialRampToValueAtTime(to, end);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(.045, start + .015);
    envelope.gain.exponentialRampToValueAtTime(.001, end);
    tone.connect(envelope);
    envelope.connect(audio.destination);
    tone.onended = () => {
      tone.disconnect();
      envelope.disconnect();
    };
    tone.start(start);
    tone.stop(end);
    start += duration * .75;
  }
}

export function silenceEffects() {
  if (state.ctx) state.ctx.suspend().catch(() => {});
}

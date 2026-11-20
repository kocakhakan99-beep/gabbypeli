import { state } from "./state.js";

export function voices(){try{const vs=window.speechSynthesis.getVoices();state.voice=vs.find(v=>v.lang.toLowerCase().startsWith('fi'))||null;}catch{}}

export function say(text){state.currentPrompt=text;if(!state.sound)return;try{if(window.speechSynthesis&&window.SpeechSynthesisUtterance){voices();window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='fi-FI';if(state.voice)u.voice=state.voice;u.rate=.85;u.pitch=1.05;u.volume=.85;window.speechSynthesis.speak(u);}}catch{}}

export function unlock(){if(!state.sound)return;try{const C=window.AudioContext||window.webkitAudioContext;if(C&&!state.ctx)state.ctx=new C();if(state.ctx&&state.ctx.state==='suspended')state.ctx.resume().catch(()=>{});}catch{}}

export function ding(){if(!state.sound||!state.ctx)return;try{[523,659,784].forEach((f,i)=>{const o=state.ctx.createOscillator(),g=state.ctx.createGain(),t=state.ctx.currentTime+i*.13;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);g.connect(state.ctx.destination);o.start(t);o.stop(t+.32);});}catch{}}

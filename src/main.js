import { el } from "./dom.js";
import { home, open } from "./navigation.js";
import { say, silenceEffects, unlock, voices } from "./audio.js";
import { state } from "./state.js";

voices();try{window.speechSynthesis.addEventListener('voiceschanged',voices);}catch{}



























['memory','puzzle','learn','find'].forEach(m=>el('open-'+m).addEventListener('click',()=>open(m)));el('home-button').addEventListener('click',home);el('other').addEventListener('click',home);el('action').addEventListener('click',()=>{if(state.action)state.action();});el('again').addEventListener('click',()=>open(state.mode));el('repeat').addEventListener('click',()=>{unlock();say(state.currentPrompt);});el('sound').addEventListener('click',()=>{state.sound=!state.sound;el('sound').setAttribute('aria-pressed',String(state.sound));el('sound').textContent=state.sound?'Äänet päällä':'Äänet pois';if(state.sound){unlock();say(state.currentPrompt||'Tervetuloa Gabbyn nukketaloon! Valitse leikki.');}else{silenceEffects();try{window.speechSynthesis.cancel();}catch{}}});

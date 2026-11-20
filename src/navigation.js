import { el } from "./dom.js";
import { feedback, setAction } from "./ui.js";
import { initMemory } from "./games/memory.js";
import { initPuzzle } from "./games/puzzle.js";
import { renderFind } from "./games/find.js";
import { renderLearn } from "./games/learning.js";
import { state } from "./state.js";
import { unlock } from "./audio.js";

export function home(){state.currentPrompt='Tervetuloa Gabbyn nukketaloon! Valitse leikki.';state.mode='';state.action=null;el('home').hidden=false;el('play').hidden=true;try{window.speechSynthesis.cancel();}catch{}}

export function open(which){el('portrait').style.backgroundSize='';el('portrait').style.backgroundPosition='';unlock();state.mode=which;el('home').hidden=true;el('play').hidden=false;el('win').hidden=true;el('content').hidden=false;['memory','puzzle','learn'].forEach(id=>el(id).hidden=id!==which);feedback('');setAction('',null);if(which==='memory')initMemory();else if(which==='puzzle')initPuzzle();else if(which==='find'){state.learnIndex=0;el('learn').hidden=false;renderFind();}else{state.learnIndex=0;renderLearn();}}

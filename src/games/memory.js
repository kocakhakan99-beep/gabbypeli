import { button, cat, feedback, finish, heading, picture, progress, setAction } from "../ui.js";
import { ding, say, unlock } from "../audio.js";
import { el } from "../dom.js";
import { friends } from "../data.js";
import { shuffle } from "../utils.js";
import { state } from "../state.js";

export function initMemory(){heading('cakey','Etsi kaveriparit','Katso ensin kuvia. Piilota sitten kortit.','Ystävien muistileikki');state.matched=0;state.opened=[];state.waiting=false;state.preview=true;state.mem=shuffle(friends.slice(0,state.memoryPairs).flatMap(f=>[{friend:f,found:false},{friend:f,found:false}]));el('memory-settings').replaceChildren();[2,3,4].forEach(n=>{const b=button(n+' paria',()=>{state.memoryPairs=n;initMemory();});b.setAttribute('aria-pressed',String(n===state.memoryPairs));el('memory-settings').append(b);});drawCards();progress(0,state.memoryPairs);feedback('Katsotaan, ketkä ovat mukana!');setAction('Piilota kortit',()=>{state.preview=false;drawCards();setAction('',null);feedback('Käännä kaksi korttia.');el('instruction').textContent='Käännä kaksi korttia. Etsi samanlaiset kuvat.';say('Käännä kaksi korttia. Missä on samanlainen kaveri?');});say('Katsotaan kaverit yhdessä. Kun olet valmis, paina Piilota kortit.');}

export function drawCards(){el('cards').className='memory '+(state.memoryPairs===2?'four':state.memoryPairs===3?'six':'eight');el('cards').replaceChildren();state.mem.forEach((m,i)=>{const up=state.preview||m.found||state.opened.includes(i);const b=button('',()=>flip(i),'memory-card'+(m.found?' matched':up?' faceup':''));b.innerHTML=picture(m.friend.id)+cat();b.setAttribute('aria-label','Kortti '+(i+1)+': '+(up?m.friend.name+(m.found?', pari löytyi':''):'kuvapuoli piilossa'));b.setAttribute('aria-pressed',String(up));b.disabled=m.found||state.preview;b.dataset.index=String(i);el('cards').append(b);});}

export function flip(i){if(state.preview||state.waiting||state.mem[i].found||state.opened.includes(i))return;unlock();state.opened.push(i);drawCards();if(state.opened.length===1){say(state.mem[i].friend.name+'. Etsi samanlainen kuva.');return;}const [a,b]=state.opened;if(state.mem[a].friend.id===state.mem[b].friend.id){state.mem[a].found=state.mem[b].found=true;state.matched++;state.opened=[];drawCards();progress(state.matched,state.memoryPairs);ding('pair');if(state.matched===state.memoryPairs){feedback('Kaikki parit löytyivät!');setAction('Juhlitaan!',()=>finish('Kaikki kaverit löytyivät!','Gabby ja Pandi Pörrö taputtavat sinulle. Hienoa muistamista!','gabby'));say('Kaikki parit löytyivät! Hienoa!');}else{feedback('Pari löytyi! Etsi seuraava.');say('Pari löytyi! Etsi seuraava.');}}else{state.waiting=true;feedback('Kaksi eri kaveria. Katsotaan rauhassa.');setAction('Käännä takaisin',()=>{state.opened=[];state.waiting=false;drawCards();setAction('',null);feedback('Kokeillaan uudestaan.');say('Kokeillaan uudestaan. Etsi samanlaiset kuvat.');});say('Nämä ovat eri kaverit. Katso kuvia rauhassa. Käännetään sitten takaisin.');}}

export function showMemoryHint() {
  if (state.matched === state.memoryPairs) return;
  state.preview = true;
  state.waiting = false;
  state.opened = [];
  drawCards();
  feedback('Katso kaverien paikat rauhassa.');
  say('Katsotaan kaverien paikat yhdessä.');
  setAction('Piilota kortit', () => {
    state.preview = false;
    drawCards();
    feedback('Etsi taas samanlaiset kaverit.');
    setAction('', null);
    say('Etsi samanlaiset kaverit.');
  });
}

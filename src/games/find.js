import { button, feedback, finish, heading, picture, progress, setAction } from "../ui.js";
import { ding, say, unlock } from "../audio.js";
import { el } from "../dom.js";
import { friends } from "../data.js";
import { shuffle } from "../utils.js";
import { state } from "../state.js";

export function renderFind(){
const f=friends[state.learnIndex];state.learnDone=false;
heading(f.id,'Kuka piilottelee?','Katso pientä kuvan osaa. Kenen kuva se on?',f.room);
el('portrait').style.backgroundSize='460% 460%';
el('portrait').style.backgroundPosition=state.learnIndex===0?'12% 20%':state.learnIndex===1?'85% 17%':state.learnIndex===2?'17% 85%':'85% 85%';
el('pattern').hidden=true;el('choices').replaceChildren();feedback('');setAction('',null);progress(state.learnIndex,4);
shuffle(friends).forEach(friend=>{const b=button('',()=>{
if(state.learnDone||b.disabled)return;unlock();
if(friend.id===f.id){state.learnDone=true;b.classList.add('correct');el('choices').querySelectorAll('button').forEach(x=>x.disabled=true);feedback('Löysit oikean kaverin! '+f.name+'!');ding('discovery');say('Löysit oikean kaverin! '+f.name);el('portrait').style.backgroundSize='';el('portrait').style.backgroundPosition='';progress(state.learnIndex+1,4);setAction(state.learnIndex===3?'Juhlitaan!':'Seuraava kaveri',()=>{state.learnIndex++;if(state.learnIndex===4)finish('Tarkat silmät!','Löysit kaikki neljä kaveria. Gabby on iloinen avustasi!','gabby');else renderFind();});
}else{b.disabled=true;feedback('Tutkitaan vielä. Katso värejä ja korvia.');say('Tutkitaan vielä. Katso kuvan värejä ja korvia.');}
},'choice');b.innerHTML='<span class="mini">'+picture(friend.id)+'</span><span>'+friend.name+'</span>';b.setAttribute('aria-label',friend.name);el('choices').append(b);});say('Kuka piilottelee? Katso kuvan osaa ja kosketa oikeaa kaveria.');
}

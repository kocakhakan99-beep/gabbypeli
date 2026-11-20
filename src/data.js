import { picture } from "./ui.js";

export const friends=[{id:'gabby',name:'Gabby ja Pandi Pörrö',room:'Gabbyn nukketalo'},{id:'cakey',name:'Hile',room:'Hileen keittiö'},{id:'mercat',name:'Merikatti',room:'Merikatin kylpyhuone'},{id:'fairy',name:'Kisukeiju',room:'Kisukeijun puutarha'}];
export const cakes=n=>'<span class="cupcakes" aria-hidden="true">'+Array(n).fill('<span class="cupcake"></span>').join('')+'</span>';

export const lessons=[
{art:0,title:'Missä on SININEN pallo?',speech:'Pandi Pörrö etsii sinistä palloa. Kosketa sinistä palloa.',win:'Sininen! Pandi Pörrö kiittää sinua!',options:[['Sininen','<span class="ball"></span>',true],['Punainen','<span class="ball red"></span>',false]]},
{art:1,title:'Etsi KAKSI kuppikakkua.',speech:'Autetaan keittiössä. Missä on kaksi kuppikakkua?',win:'Yksi, kaksi! Kaksi kuppikakkua!',options:[['Yksi',cakes(1),false],['Kaksi',cakes(2),true]]},
{art:2,title:'Etsi YMPYRÄ.',speech:'Merikatti etsii ympyrää. Se on pyöreä kuin kupla.',win:'Ympyrä! Pyöreä kuin kupla!',options:[['Ympyrä','<span class="shape circle"></span>',true],['Neliö','<span class="shape"></span>',false]]},
{art:1,title:'Etsi KOLME kuppikakkua.',speech:'Vieraita tulee lisää. Missä on kolme kuppikakkua?',win:'Yksi, kaksi, kolme! Hienosti laskettu!',options:[['Kaksi',cakes(2),false],['Kolme',cakes(3),true],['Yksi',cakes(1),false]]},
{art:3,title:'Missä on KELTAINEN pallo?',speech:'Puutarhassa leikitään palloilla. Kosketa keltaista palloa.',win:'Keltainen! Kuin lämmin auringonpaiste!',options:[['Keltainen','<span class="ball yellow"></span>',true],['Sininen','<span class="ball"></span>',false]]},
{art:0,title:'Kuka tulee seuraavaksi?',speech:'Gabby ja Pandi Pörrö, Hile, Gabby ja Pandi Pörrö. Kuka tulee seuraavaksi?',win:'Hile! Keksit, miten jono jatkuu!',pattern:true,options:[['Gabby ja Pandi Pörrö','<span class="mini">'+picture('gabby')+'</span>',false],['Hile','<span class="mini">'+picture('cakey')+'</span>',true]]}
];

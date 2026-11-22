import type { Choice, Friend, Lesson } from "./types.js";
import { picture } from "./ui.js";

export const friends: Friend[] = [
  { id: "gabby", name: "Gabby", room: "Gabbyn nukketalo", tile: 0 },
  { id: "cakey", name: "Hile", room: "Hileen keittiö", tile: 2 },
  { id: "mercat", name: "Merikatti", room: "Merikatin kylpyhuone", tile: 3 },
  { id: "fairy", name: "Kisukeiju", room: "Kisukeijun puutarha", tile: 4 },
  { id: "pandy", name: "Pandi Pörrö", room: "Pandin leikkihuone", tile: 1 },
  { id: "dj", name: "DJ Catnip", room: "DJ Catnipin musiikkihuone", tile: 5 },
];
export const cakes = (n: number) =>
  '<span class="cupcakes" aria-hidden="true">' +
  Array(n).fill('<span class="cupcake"></span>').join("") +
  "</span>";

export const lessons: Lesson[] = [
  {
    art: 0,
    title: "Missä on SININEN pallo?",
    speech: "Pandi Pörrö etsii sinistä palloa. Kosketa sinistä palloa.",
    win: "Sininen! Pandi Pörrö kiittää sinua!",
    options: [
      ["Sininen", '<span class="ball"></span>', true],
      ["Punainen", '<span class="ball red"></span>', false],
    ],
  },
  {
    art: 1,
    title: "Etsi KAKSI kuppikakkua.",
    speech: "Autetaan keittiössä. Missä on kaksi kuppikakkua?",
    win: "Yksi, kaksi! Kaksi kuppikakkua!",
    options: [
      ["Yksi", cakes(1), false],
      ["Kaksi", cakes(2), true],
    ],
  },
  {
    art: 2,
    title: "Etsi YMPYRÄ.",
    speech: "Merikatti etsii ympyrää. Se on pyöreä kuin kupla.",
    win: "Ympyrä! Pyöreä kuin kupla!",
    options: [
      ["Ympyrä", '<span class="shape circle"></span>', true],
      ["Neliö", '<span class="shape"></span>', false],
    ],
  },
  {
    art: 1,
    title: "Etsi KOLME kuppikakkua.",
    speech: "Vieraita tulee lisää. Missä on kolme kuppikakkua?",
    win: "Yksi, kaksi, kolme! Hienosti laskettu!",
    options: [
      ["Kaksi", cakes(2), false],
      ["Kolme", cakes(3), true],
      ["Yksi", cakes(1), false],
    ],
  },
  {
    art: 3,
    title: "Missä on KELTAINEN pallo?",
    speech: "Puutarhassa leikitään palloilla. Kosketa keltaista palloa.",
    win: "Keltainen! Kuin lämmin auringonpaiste!",
    options: [
      ["Keltainen", '<span class="ball yellow"></span>', true],
      ["Sininen", '<span class="ball"></span>', false],
    ],
  },
  {
    art: 0,
    title: "Kuka tulee seuraavaksi?",
    speech:
      "Gabby ja Pandi Pörrö, Hile, Gabby ja Pandi Pörrö. Kuka tulee seuraavaksi?",
    win: "Hile! Keksit, miten jono jatkuu!",
    pattern: true,
    options: [
      [
        "Gabby ja Pandi Pörrö",
        '<span class="mini">' + picture("gabby") + "</span>",
        false,
      ],
      ["Hile", '<span class="mini">' + picture("cakey") + "</span>", true],
    ],
  },
];

const objectChoice = (name: string, id: string, correct: boolean): Choice => [
  name,
  '<span class="mini">' + picture(id) + "</span>",
  correct,
];

lessons.push(
  {
    art: 3,
    title: "Millä kastellaan kukkia?",
    speech: "Millä kastellaan kukkia?",
    win: "Kastelukannulla! Kukat saavat vettä.",
    options: [
      objectChoice("Kastelukannu", "watering", true),
      objectChoice("Juna", "train", false),
    ],
  },
  {
    art: 2,
    title: "Mikä kulkee vedessä?",
    speech: "Mikä kulkee vedessä?",
    win: "Vene! Se kelluu vedessä.",
    options: [
      objectChoice("Palikat", "blocks", false),
      objectChoice("Vene", "boat", true),
    ],
  },
  {
    art: 1,
    title: "Missä kuvassa on kaksi kuppikakkua?",
    speech: "Missä kuvassa on kaksi kuppikakkua?",
    win: "Yksi, kaksi. Löysit kuppikakut!",
    options: [
      objectChoice("Mansikka", "berry", false),
      objectChoice("Kuppikakut", "cupcakes", true),
    ],
  },
);

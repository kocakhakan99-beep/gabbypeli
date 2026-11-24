export type BakingStep = {
  action: string;
  instruction: string;
  image: string;
  tool?: string;
  result?: string;
  repeat?: boolean;
};

type Decoration = { name: string; image: string; tool?: string };

export const recipes = {
  cookie: {
    name: "Piparit", piece: "pipari", heat: 175, raw: "cat-cutout",
    ready: "results/baked_cookie_1.webp",
    prepare: [
      { action: "Kauli taikina", instruction: "Vie kaulin taikinan yli.", image: "dough", tool: "rolling-pin", result: "cookie-sheet" },
      { action: "Paina kissamuottia", instruction: "Paina kissamuotilla yksi pipari kerrallaan.", image: "cookie-sheet", tool: "cat-cutter", result: "cat-cutout", repeat: true },
    ],
    after: [],
    decorations: [
      { name: "Strösseli", image: "cookie-sprinkle" },
      { name: "Tähti", image: "cookie-star" },
    ],
  },
  cupcake: {
    name: "Kuppikakut", piece: "kuppikakku", heat: 200, raw: "filled-liner",
    ready: "results/plain_cupcake_pink.webp",
    prepare: [
      { action: "Aseta vuoka", instruction: "Aseta vuoat pellille yksi kerrallaan.", image: "cupcake-tray", tool: "liner", result: "liner", repeat: true },
      { action: "Täytä vuoka", instruction: "Annostele taikinaa jokaiseen vuokaan.", image: "liner", result: "filled-liner", repeat: true },
    ],
    after: [
      { action: "Lisää kuorrute", instruction: "Kuorruta kuppikakut yksi kerrallaan.", image: "results/plain_cupcake_pink.webp", tool: "frosting", result: "frosting", repeat: true },
    ],
    decorations: [
      { name: "Mustikka", image: "cupcake-blueberry", tool: "tart-blueberry" },
      { name: "Mansikka", image: "cupcake-strawberry", tool: "tart-strawberry" },
    ],
  },
  bun: {
    name: "Korvapuustit", piece: "korvapuusti", heat: 200, raw: "bun-raw",
    ready: "steps/bun-baked.webp",
    prepare: [
      { action: "Kauli levy", instruction: "Kauli taikina suorakaiteeksi.", image: "dough", tool: "rolling-pin", result: "bun-sheet" },
      { action: "Levitä täyte", instruction: "Levitä kanelitäyte levylle.", image: "bun-sheet", result: "bun-filling" },
      { action: "Rullaa levy", instruction: "Rullaa taikina täytteen ympärille.", image: "bun-filling", result: "bun-log" },
      { action: "Leikkaa viipale", instruction: "Leikkaa taikinarullasta kierrepaloja.", image: "bun-log", result: "bun-raw", repeat: true },
    ],
    after: [],
    decorations: [{ name: "Kuorrute", image: "bun-glazed" }],
  },
  tart: {
    name: "Marjatortut", piece: "torttupohja", heat: 175, raw: "tart-raw",
    ready: "steps/tart-shell.webp",
    prepare: [
      { action: "Painele taikina", instruction: "Painele taikina torttuvuokaan.", image: "tart-pan", tool: "tart-dough", result: "tart-raw" },
    ],
    after: [
      { action: "Täytä torttu", instruction: "Lisää täyte paistettuun pohjaan.", image: "tart-shell", tool: "tart-cream", result: "tart-cream" },
    ],
    decorations: [
      { name: "Mansikka", image: "tart-red", tool: "tart-strawberry" },
      { name: "Vadelma", image: "tart-raspberry-result", tool: "tart-raspberry" },
      { name: "Mustikka", image: "tart-mixed", tool: "tart-blueberry" },
    ],
  },
} satisfies Record<string, {
  name: string; piece: string; heat: number; raw: string; ready: string;
  prepare: BakingStep[]; after: BakingStep[]; decorations: Decoration[];
}>;

export type RecipeId = keyof typeof recipes;
export type Recipe = (typeof recipes)[RecipeId];

export const orders: ReadonlyArray<{
  recipe?: RecipeId; count: number; mix: boolean; finish: boolean; requested?: string; toppings?: number;
}> = [
  { recipe: "cookie", count: 2, mix: false, finish: false },
  { recipe: "cookie", count: 3, mix: true, finish: true },
  { recipe: "cupcake", count: 2, mix: false, finish: false },
  { recipe: "cupcake", count: 3, mix: true, finish: true },
  { recipe: "bun", count: 2, mix: false, finish: false },
  { recipe: "bun", count: 3, mix: true, finish: true },
  { recipe: "tart", count: 1, mix: false, finish: true },
  { recipe: "tart", count: 1, mix: true, finish: true, toppings: 2 },
  { recipe: "cupcake", count: 4, mix: true, finish: true, requested: "Mustikka" },
  { count: 3, mix: true, finish: true },
];

export const stepAsset = (image: string): string =>
  "./assets/gabby/bakery/" + (image.includes("/") ? image : `steps/${image}.webp`);

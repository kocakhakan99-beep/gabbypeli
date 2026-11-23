export const campaignGames = ["memory", "puzzle", "find", "garden", "baking"] as const;
export type CampaignGame = (typeof campaignGames)[number];
const key = (game: CampaignGame) => `gabbypeli-campaign-${game}-v1`;
export const levelCount = 10;
export const coinReward = 25;
const completed: Record<CampaignGame, number> = { memory: 0, puzzle: 0, find: 0, garden: 0, baking: 0 };
let activeGame: CampaignGame = "memory";
let active: number | undefined;

function readProgress(game: CampaignGame): number {
  try {
    const value = Number(localStorage.getItem(key(game)));
    if (Number.isInteger(value) && value >= 0 && value <= levelCount)
      completed[game] = Math.max(completed[game], value);
  } catch { /* Keep progress in memory when storage is unavailable. */ }
  return completed[game];
}

export function campaignLevel() {
  return active;
}

export function setCampaignLevel(level?: number, game: CampaignGame = "memory"): void {
  activeGame = game;
  active = level !== undefined && Number.isInteger(level) && level >= 1 &&
    level <= Math.min(levelCount, readProgress(activeGame) + 1) ? level : undefined;
}

export function awardCampaignLevel(): number {
  if (active !== readProgress(activeGame) + 1) return 0;
  completed[activeGame] = active;
  try { localStorage.setItem(key(activeGame), String(active)); }
  catch { /* Keep progress for this session. */ }
  return coinReward;
}

export function renderCampaign(game: CampaignGame, start: (level: number) => void): void {
  const progress = readProgress(game);
  const names: Record<CampaignGame, string> = {
    memory: "Muistipeli", puzzle: "Palapeli", find: "Piilopeli",
    garden: "Puutarha", baking: "Leipomo",
  };
  const meter = document.querySelector<HTMLProgressElement>("#gf-map-progress")!;
  meter.value = progress;
  meter.setAttribute("aria-label", names[game] + ", eteneminen");
  document.querySelector("#gf-map-progress-label")!.textContent =
    names[game] + " · " + progress + " / " + levelCount;
  document.querySelector("#gf-coins")!.textContent = String(campaignGames.reduce((sum, game) => sum + readProgress(game), 0) * coinReward);
  const map = document.querySelector<HTMLElement>("#gf-levels")!;
  map.dataset.game = game;
  map.replaceChildren();
  const resume = document.querySelector<HTMLButtonElement>("#gf-campaign-resume")!;
  resume.hidden = progress >= levelCount;
  resume.textContent = progress ? `Jatka tasolta ${progress + 1}` : "Aloita seikkailu";
  resume.onclick = () => start(progress + 1);
  for (let level = 1; level <= levelCount; level++) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(level);
    button.disabled = level > progress + 1;
    if (level === progress + 1) button.setAttribute("aria-current", "step");
    button.dataset.completed = String(level <= progress);
    button.setAttribute("aria-label", `Taso ${level}${level <= progress ? ", suoritettu" : button.disabled ? ", lukittu" : ""}`);
    if (button.disabled || level <= progress) {
      const mark = document.createElement("span");
      mark.className = "level-mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = button.disabled ? "▣" : "✓";
      button.append(mark);
    }
    button.onclick = () => start(level);
    map.append(button);
  }
}

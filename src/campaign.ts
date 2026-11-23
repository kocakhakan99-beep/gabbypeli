const key = "gabbypeli-campaign-memory-v1";
export const levelCount = 10;
export const coinReward = 25;
let completed = 0;
let active: number | undefined;

function readProgress(): number {
  try {
    const value = Number(localStorage.getItem(key));
    if (Number.isInteger(value) && value >= 0 && value <= levelCount)
      completed = Math.max(completed, value);
  } catch { /* Keep progress in memory when storage is unavailable. */ }
  return completed;
}

export function campaignLevel() {
  return active;
}

export function setCampaignLevel(level?: number): void {
  active = level !== undefined && Number.isInteger(level) && level >= 1 &&
    level <= Math.min(levelCount, readProgress() + 1) ? level : undefined;
}

export function awardCampaignLevel(): number {
  if (active !== readProgress() + 1) return 0;
  completed = active;
  try { localStorage.setItem(key, String(completed)); }
  catch { /* Keep progress for this session. */ }
  return coinReward;
}

export function renderCampaign(start: (level: number) => void): void {
  const progress = readProgress();
  document.querySelector("#gf-coins")!.textContent = String(progress * coinReward);
  const map = document.querySelector("#gf-levels")!;
  map.replaceChildren();
  for (let level = 1; level <= levelCount; level++) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(level);
    button.disabled = level > progress + 1;
    button.dataset.completed = String(level <= progress);
    button.setAttribute("aria-label", `Taso ${level}${level <= progress ? ", suoritettu" : button.disabled ? ", lukittu" : ""}`);
    button.onclick = () => start(level);
    map.append(button);
  }
}

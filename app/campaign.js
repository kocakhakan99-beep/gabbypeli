const games = ["memory", "puzzle"];
const key = (game) => `gabbypeli-campaign-${game}-v1`;
export const levelCount = 10;
export const coinReward = 25;
const completed = { memory: 0, puzzle: 0 };
let activeGame = "memory";
let active;
function readProgress(game) {
    try {
        const value = Number(localStorage.getItem(key(game)));
        if (Number.isInteger(value) && value >= 0 && value <= levelCount)
            completed[game] = Math.max(completed[game], value);
    }
    catch { /* Keep progress in memory when storage is unavailable. */ }
    return completed[game];
}
export function campaignLevel() {
    return active;
}
export function setCampaignLevel(level, game = "memory") {
    activeGame = game;
    active = level !== undefined && Number.isInteger(level) && level >= 1 &&
        level <= Math.min(levelCount, readProgress(activeGame) + 1) ? level : undefined;
}
export function awardCampaignLevel() {
    if (active !== readProgress(activeGame) + 1)
        return 0;
    completed[activeGame] = active;
    try {
        localStorage.setItem(key(activeGame), String(active));
    }
    catch { /* Keep progress for this session. */ }
    return coinReward;
}
export function renderCampaign(game, start) {
    const progress = readProgress(game);
    document.querySelector("#gf-coins").textContent = String(games.reduce((sum, game) => sum + readProgress(game), 0) * coinReward);
    const map = document.querySelector("#gf-levels");
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

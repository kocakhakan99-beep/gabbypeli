export const campaignGames = ["memory", "puzzle", "find", "garden", "baking"];
const key = (game) => `gabbypeli-campaign-${game}-v1`;
export const levelCount = 10;
export const coinReward = 25;
const completed = { memory: 0, puzzle: 0, find: 0, garden: 0, baking: 0 };
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
    const names = {
        memory: "Muistipeli", puzzle: "Palapeli", find: "Piilopeli",
        garden: "Puutarha", baking: "Leipomo",
    };
    const meter = document.querySelector("#gf-map-progress");
    meter.value = progress;
    meter.setAttribute("aria-label", names[game] + ", eteneminen");
    document.querySelector("#gf-map-progress-label").textContent =
        names[game] + " · " + progress + " / " + levelCount;
    document.querySelector("#gf-coins").textContent = String(campaignGames.reduce((sum, game) => sum + readProgress(game), 0) * coinReward);
    const map = document.querySelector("#gf-levels");
    map.dataset.game = game;
    map.replaceChildren();
    const resume = document.querySelector("#gf-campaign-resume");
    resume.hidden = progress >= levelCount;
    resume.textContent = progress ? `Jatka tasolta ${progress + 1}` : "Aloita seikkailu";
    resume.onclick = () => start(progress + 1);
    for (let level = 1; level <= levelCount; level++) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(level);
        button.disabled = level > progress + 1;
        if (level === progress + 1)
            button.setAttribute("aria-current", "step");
        button.dataset.completed = String(level <= progress);
        button.setAttribute("aria-label", `Taso ${level}${level <= progress ? ", suoritettu" : button.disabled ? ", lukittu" : ""}`);
        if (button.disabled || level <= progress) {
            const mark = document.createElement("span");
            mark.className = "level-mark";
            mark.setAttribute("aria-hidden", "true");
            mark.classList.add(button.disabled ? "locked" : "completed");
            button.append(mark);
        }
        button.onclick = () => start(level);
        map.append(button);
    }
}

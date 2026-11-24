const styleFrames = {
    adventure: "banner_adventure button_back level_base level_current lock_gold path_straight path_u star_gold".split(" "),
    home: "door_mat facade_trim flower_pot_pink flower_pot_yellow heart_whiskers roof_ear_left roof_ear_right room_locked_left room_locked_right".split(" "),
    ui: "button_green_large button_purple_large coin counter_paw icon_games icon_home icon_settings icon_sound icon_stickers logo_main".split(" "),
    rewards: "banner_complete button_home button_next button_replay coin_stack star_empty star_gold".split(" "),
    bakery: "batter_dollop_large bowl_batter bowl_egg bowl_empty bowl_flour oven_body oven_door_frame oven_glass oven_handle oven_light oven_rack parchment raw_pink spoon temperature_knob tray".split(" "),
    garden: "leaf_green shovel water_splash watering_can".split(" "),
    controls: "blank_chip chip_selected_large progress_fill progress_track slider_thumb toggle_knob toggle_off_track toggle_track_on".split(" "),
};
const groups = new Map();
const base = new URL("../assets/gabby/", import.meta.url);
async function readAtlas(group) {
    const image = new Image();
    image.src = new URL(`atlases/${group}.webp`, base).href;
    const [atlas] = await Promise.all([
        fetch(new URL(`atlases/${group}.webp.json`, base)).then((response) => {
            if (!response.ok)
                throw new Error(`Atlas metadata HTTP ${response.status}`);
            return response.json();
        }),
        image.decode(),
    ]);
    return { image, atlas };
}
async function frameURL(image, frame, group, name) {
    if (!frame || frame.rotated || frame.trimmed)
        throw new Error("Unsupported atlas frame");
    const { x, y, w, h } = frame.frame;
    // The last three columns belong to the neighboring sprite in the home sheet.
    const width = group === "home" && name === "room_bakery" ? w - 3 : w;
    const surface = document.createElement("canvas");
    surface.width = width;
    surface.height = h;
    const ctx = surface.getContext("2d");
    if (!ctx)
        throw new Error("Canvas unavailable");
    ctx.drawImage(image, x, y, width, h, 0, 0, width, h);
    const blob = await new Promise((resolve) => surface.toBlob(resolve));
    if (!blob)
        throw new Error("Could not render atlas frame");
    return URL.createObjectURL(blob);
}
/** Use the same atlas pair as Phaser while keeping native HTML controls. */
export function loadDOMAtlas(group) {
    const existing = groups.get(group);
    if (existing)
        return existing;
    const loading = (async () => {
        const game = document.querySelector("#gabby-fi");
        const targets = [...game.querySelectorAll(`img[data-gabby-frame^="${group}/"]`)];
        const names = new Set([...styleFrames[group], ...targets.map((target) => target.dataset.gabbyFrame.split("/")[1])]);
        const atlas = await readAtlas(group).catch(() => undefined);
        await Promise.all([...names].map(async (name) => {
            const fallback = new URL(`${group}/${name}.webp`, base).href;
            const url = atlas
                ? await frameURL(atlas.image, atlas.atlas.frames[name], group, name).catch(() => fallback)
                : fallback;
            if (styleFrames[group].includes(name)) {
                game.style.setProperty(`--gabby-${group}-${name}`, `url("${url}")`);
            }
            for (const target of targets) {
                if (target.dataset.gabbyFrame === `${group}/${name}`)
                    target.src = url;
            }
        }));
    })();
    groups.set(group, loading);
    return loading;
}

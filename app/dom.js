const element = document.getElementById("gabby-fi");
if (!element)
    throw new Error("Game root is missing");
export const root = element;
export function el(id) {
    const element = root.querySelector("#gf-" + id);
    if (!element)
        throw new Error("Missing game element: " + id);
    return element;
}

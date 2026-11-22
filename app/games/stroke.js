const cleanups = new WeakMap();
export function bindStroke(surface, handlers) {
    cleanups.get(surface)?.();
    const listeners = new AbortController();
    const { signal } = listeners;
    let pointer;
    let previous;
    const point = (event) => ({
        x: event.clientX,
        y: event.clientY,
    });
    function end() {
        if (pointer === undefined)
            return;
        const captured = pointer;
        pointer = undefined;
        if (surface.hasPointerCapture(captured))
            surface.releasePointerCapture(captured);
        handlers.end();
    }
    surface.addEventListener("pointerdown", (event) => {
        if (pointer !== undefined || event.button !== 0)
            return;
        pointer = event.pointerId;
        previous = point(event);
        surface.setPointerCapture(pointer);
        handlers.start(previous);
    }, { signal });
    surface.addEventListener("pointermove", (event) => {
        if (event.pointerId !== pointer)
            return;
        const next = point(event);
        handlers.move(previous, next);
        previous = next;
    }, { signal });
    surface.addEventListener("pointerup", (event) => {
        if (event.pointerId !== pointer)
            return;
        handlers.move(previous, point(event));
        end();
    }, { signal });
    for (const name of ["pointercancel", "lostpointercapture"]) {
        surface.addEventListener(name, (event) => {
            if (event.pointerId === pointer)
                end();
        }, { signal });
    }
    cleanups.set(surface, () => {
        listeners.abort();
        end();
    });
}
export function stopStroke(surface) {
    cleanups.get(surface)?.();
    cleanups.delete(surface);
}
export function distanceToStroke(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared
        ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
        : 0;
    return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

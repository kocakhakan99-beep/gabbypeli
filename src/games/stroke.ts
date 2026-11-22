// Use screen coordinates so hit testing works equally for mouse, pen and touch.
export type Point = { x: number; y: number };
interface StrokeHandlers {
  start(point: Point): void;
  move(from: Point, to: Point): void;
  end(releasedAt?: Point): void;
}

const cleanups = new WeakMap<HTMLElement, () => void>();

export function bindStroke(
  surface: HTMLElement,
  handlers: StrokeHandlers,
): void {
  cleanups.get(surface)?.();
  const listeners = new AbortController();
  const { signal } = listeners;
  let pointer: number | undefined;
  let previous: Point;
  const point = (event: PointerEvent): Point => ({
    x: event.clientX,
    y: event.clientY,
  });

  function end(releasedAt?: Point): void {
    if (pointer === undefined) return;
    const captured = pointer;
    pointer = undefined;
    if (surface.hasPointerCapture(captured))
      surface.releasePointerCapture(captured);
    handlers.end(releasedAt);
  }

  surface.addEventListener(
    "pointerdown",
    (event) => {
      if (pointer !== undefined || event.button !== 0) return;
      pointer = event.pointerId;
      previous = point(event);
      surface.setPointerCapture(pointer);
      handlers.start(previous);
    },
    { signal },
  );
  surface.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerId !== pointer) return;
      const next = point(event);
      handlers.move(previous, next);
      previous = next;
    },
    { signal },
  );
  surface.addEventListener(
    "pointerup",
    (event) => {
      if (event.pointerId !== pointer) return;
      handlers.move(previous, point(event));
      end(point(event));
    },
    { signal },
  );
  for (const name of ["pointercancel", "lostpointercapture"] as const) {
    surface.addEventListener(
      name,
      (event) => {
        if (event.pointerId === pointer) end();
      },
      { signal },
    );
  }
  cleanups.set(surface, () => {
    listeners.abort();
    end();
  });
}

export function stopStroke(surface: HTMLElement): void {
  cleanups.get(surface)?.();
  cleanups.delete(surface);
}

export function distanceToStroke(
  point: Point,
  start: Point,
  end: Point,
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared
    ? Math.max(
        0,
        Math.min(
          1,
          ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
        ),
      )
    : 0;
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

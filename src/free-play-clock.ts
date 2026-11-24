let tick: ReturnType<typeof setInterval> | undefined;

function readout(): HTMLOutputElement {
  return document.querySelector<HTMLOutputElement>("#gf-free-time-left")!;
}

export function stopFreePlayClock(): void {
  clearInterval(tick);
  tick = undefined;
  readout().hidden = true;
}

export function startFreePlayClock(expire: () => void): void {
  const select = document.querySelector<HTMLSelectElement>("#gf-free-time")!;
  const duration = Number(select.value) * 60;
  if (!duration) return;
  const end = Date.now() + duration * 1000;
  const output = readout();
  const update = () => {
    const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    output.value = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
    if (remaining === 0) {
      stopFreePlayClock();
      expire();
    }
  };
  output.hidden = false;
  update();
  tick = setInterval(update, 250);
}

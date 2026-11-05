// Undo history for edits that arrive in bursts (dragging, sliders, typing): the state from before
// a burst is saved once, at its start, and the burst ends after `quietMs` without changes. So one
// undo takes back a whole drag, and edits further apart each get their own step.

export const HISTORY_BURST_MS = 500;

export function historyBurst<A extends unknown[]>(save: (...args: A) => void, quietMs: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (!timer) save(...args);
    else clearTimeout(timer);
    timer = setTimeout(() => { timer = null; }, quietMs);
  };
}

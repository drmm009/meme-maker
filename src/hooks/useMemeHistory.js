import { useState, useRef, useEffect, useCallback } from 'react';

export const cloneSnapshot = (v) => {
  if (v === undefined) return v;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(v);
    } catch {
      // fall through to JSON
    }
  }
  return JSON.parse(JSON.stringify(v));
};

// Pure helpers (exported for tests) — no React here.
export function pushToStack(stack, step, snapshot, limit = 30) {
  const base = stack.slice(0, step + 1);
  base.push(snapshot);
  const next = base.length > limit ? base.slice(base.length - limit) : base;
  return { stack: next, step: next.length - 1 };
}

export function undoStep(step) {
  return step <= 0 ? 0 : step - 1;
}

export function redoStep(step, length) {
  return step >= length - 1 ? step : step + 1;
}

// Generic capped undo/redo stack with debounced push + timer cleanup.
// Snapshots are opaque to the hook; callers build/apply them.
// Refs mirror state so pushes are synchronous and StrictMode-safe (no side effects in updaters).
export function useMemeHistory(initializer, { limit = 30, debounceMs = 800 } = {}) {
  const [history, setHistory] = useState(() => [
    typeof initializer === 'function' ? initializer() : initializer,
  ]);
  const [historyStep, setHistoryStep] = useState(0);
  const historyRef = useRef(history);
  const stepRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const pushSnapshot = useCallback(
    (snapshot) => {
      const { stack: next, step: nextStep } = pushToStack(
        historyRef.current,
        stepRef.current,
        snapshot,
        limit
      );
      historyRef.current = next;
      stepRef.current = nextStep;
      setHistory(next);
      setHistoryStep(nextStep);
    },
    [limit]
  );

  const pushSnapshotDebounced = useCallback(
    (snapshot) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        pushSnapshot(snapshot);
      }, debounceMs);
    },
    [pushSnapshot, debounceMs]
  );

  const undoSnapshot = useCallback(() => {
    if (stepRef.current <= 0) return null;
    stepRef.current -= 1;
    setHistoryStep(stepRef.current);
    return historyRef.current[stepRef.current] || null;
  }, []);

  const redoSnapshot = useCallback(() => {
    if (stepRef.current >= historyRef.current.length - 1) return null;
    stepRef.current += 1;
    setHistoryStep(stepRef.current);
    return historyRef.current[stepRef.current] || null;
  }, []);

  return {
    history,
    historyStep,
    pushSnapshot,
    pushSnapshotDebounced,
    undoSnapshot,
    redoSnapshot,
    canUndo: historyStep > 0,
    canRedo: historyStep < history.length - 1,
  };
}

// Quota-safe localStorage helpers. All failures (private mode, quota exceeded,
// corrupt JSON) degrade to in-memory defaults — never throw.

export function safeGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return fallback;
  }
}

export function safeSet(key, value) {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    return true;
  } catch {
    // QuotaExceededError / SecurityError: caller keeps in-memory state.
    return false;
  }
}

export function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

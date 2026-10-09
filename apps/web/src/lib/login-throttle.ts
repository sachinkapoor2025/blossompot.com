const STORAGE_KEY = "blossompot_login_failures";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

type FailureState = { count: number; lockedUntil: number };

function sessionStore(): Storage | null {
  try {
    const store = (globalThis as { sessionStorage?: Storage }).sessionStorage;
    return store ?? null;
  } catch {
    return null;
  }
}

function readState(): FailureState {
  const storage = sessionStore();
  if (!storage) return { count: 0, lockedUntil: 0 };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lockedUntil: 0 };
    const parsed = JSON.parse(raw) as FailureState;
    if (parsed.lockedUntil && parsed.lockedUntil < Date.now()) {
      storage.removeItem(STORAGE_KEY);
      return { count: 0, lockedUntil: 0 };
    }
    return {
      count: Number(parsed.count) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0,
    };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

function writeState(state: FailureState) {
  sessionStore()?.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loginLockMessage(): string | null {
  const state = readState();
  if (!state.lockedUntil || state.lockedUntil <= Date.now()) return null;
  const minutes = Math.max(1, Math.ceil((state.lockedUntil - Date.now()) / 60000));
  return `Too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

export function recordFailedLogin(): string | null {
  const state = readState();
  const count = state.count + 1;
  if (count >= MAX_ATTEMPTS) {
    writeState({ count, lockedUntil: Date.now() + LOCK_MS });
    return loginLockMessage();
  }
  writeState({ count, lockedUntil: 0 });
  return null;
}

export function clearFailedLogins() {
  sessionStore()?.removeItem(STORAGE_KEY);
}

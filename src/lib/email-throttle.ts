const THROTTLE_MS = 15 * 60 * 1000; // 15 minutes
const CLEANUP_MS = 60 * 60 * 1000; // 1 hour

const lastSent = new Map<string, number>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, ts] of lastSent) {
      if (now - ts > CLEANUP_MS) lastSent.delete(key);
    }
    if (lastSent.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_MS);
}

export function shouldSendEmail(userId: string, type: string): boolean {
  const key = `${userId}-${type}`;
  const now = Date.now();
  const last = lastSent.get(key);
  if (last && now - last < THROTTLE_MS) return false;
  lastSent.set(key, now);
  ensureCleanup();
  return true;
}

export function _resetThrottle() {
  lastSent.clear();
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

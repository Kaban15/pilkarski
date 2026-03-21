const hits = new Map<string, { count: number; resetAt: number }>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key);
  }
}, 5 * 60_000);

/**
 * Simple in-memory rate limiter.
 * Returns true if the request should be BLOCKED.
 */
export function isRateLimited(
  key: string,
  { maxAttempts = 5, windowMs = 60_000 } = {},
): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxAttempts;
}

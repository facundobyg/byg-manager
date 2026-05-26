// In-memory rate limiter for login — sufficient for private beta.
// Resets on server restart (acceptable; not a persistent threat surface).

const WINDOW_MS   = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>();

export function isRateLimited(ip: string): boolean {
  const now   = Date.now();
  const entry = store.get(ip);
  if (!entry || now > entry.resetAt) return false;
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(ip: string): void {
  const now   = Date.now();
  const entry = store.get(ip);
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count = Math.min(entry.count + 1, MAX_ATTEMPTS + 1);
  }
}

export function clearRateLimit(ip: string): void {
  store.delete(ip);
}

/**
 * In-memory rate limiter. Use for development/single-instance.
 * For production with multiple instances, replace with Redis (e.g. @upstash/ratelimit).
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function scheduleCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL_MS);
  if (cleanupTimer.unref) cleanupTimer.unref();
}

export interface RateLimitOptions {
  /** Max requests in the window */
  limit: number;
  /** Window in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

const DEFAULT_OPTIONS: Record<string, RateLimitOptions> = {
  auth: { limit: 10, windowSeconds: 60 },
  login: { limit: 5, windowSeconds: 60 }, // Stricter for sign-in attempts
  signup: { limit: 5, windowSeconds: 300 },
  verify: { limit: 10, windowSeconds: 300 },
  resetPassword: { limit: 5, windowSeconds: 300 },
  contact: { limit: 5, windowSeconds: 300 },
};

/**
 * Check rate limit by identifier (e.g. IP or email).
 * Returns { success: false } when limit exceeded.
 */
export function checkRateLimit(
  key: string,
  type: keyof typeof DEFAULT_OPTIONS = "auth",
  options?: Partial<RateLimitOptions>
): RateLimitResult {
  scheduleCleanup();
  const opts = { ...DEFAULT_OPTIONS[type], ...options };
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const entry = store.get(key);

  let count: number;
  let resetAt: number;

  if (!entry || entry.resetAt <= now) {
    count = 1;
    resetAt = now + windowMs;
    store.set(key, { count, resetAt });
  } else {
    count = entry.count + 1;
    resetAt = entry.resetAt;
    entry.count = count;
  }

  const remaining = Math.max(0, opts.limit - count);
  const success = count <= opts.limit;

  return { success, remaining, resetAt };
}

/**
 * Get client identifier from request (IP or x-forwarded-for).
 */
export function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : null;
  return ip || "unknown";
}

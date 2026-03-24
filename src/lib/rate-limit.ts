interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface BucketState {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, BucketState>();

function getNow(): number {
  return Date.now();
}

function getBucketKey(scope: string, identifier: string): string {
  return `${scope}:${identifier}`;
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export function checkRateLimit(
  scope: string,
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const key = getBucketKey(scope, identifier);
  const now = getNow();
  const existing = rateLimitStore.get(key);

  if (!existing || now >= existing.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, options.maxRequests - existing.count),
    retryAfterSeconds: 0,
  };
}

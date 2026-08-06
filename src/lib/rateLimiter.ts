/**
 * 🛡️ In-Memory Sliding Window Rate Limiter for AyushGyaan AI API
 * Prevents DDoS attacks, abusive scripts, and unauthorized API billing spikes.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    record.timestamps = record.timestamps.filter(ts => now - ts < 60000);
    if (record.timestamps.length === 0) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Checks if a key (User ID or IP) has exceeded request limits.
 * @param key Identifier (User ID or IP address)
 * @param maxRequests Maximum allowed requests per window (default: 15)
 * @param windowMs Time window in milliseconds (default: 60000ms / 1 min)
 */
export function checkRateLimit(
  key: string, 
  maxRequests: number = 15, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTimeMs: number } {
  const now = Date.now();
  let record = rateLimitMap.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(key, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetTimeMs = windowMs - (now - oldestTimestamp);
    return {
      allowed: false,
      remaining: 0,
      resetTimeMs
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    resetTimeMs: windowMs
  };
}

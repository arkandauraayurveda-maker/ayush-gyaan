/**
 * ⚡ In-Memory Embedding Cache Helper
 * Caches vector embeddings for frequent queries to minimize Gemini API calls & latency.
 */

interface CacheEntry {
  vector: number[];
  expiresAt: number;
}

const embeddingCache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 Hour Cache TTL

/**
 * Normalizes query string for cache key matching.
 */
function getCacheKey(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Retrieves cached vector embedding if present and valid.
 */
export function getCachedEmbedding(text: string): number[] | null {
  const key = getCacheKey(text);
  const entry = embeddingCache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    embeddingCache.delete(key);
    return null;
  }

  return entry.vector;
}

/**
 * Stores generated vector embedding into in-memory cache.
 */
export function setCachedEmbedding(text: string, vector: number[], ttlMs: number = DEFAULT_TTL_MS): void {
  const key = getCacheKey(text);
  embeddingCache.set(key, {
    vector,
    expiresAt: Date.now() + ttlMs
  });

  // Keep cache size bounded (max 5,000 queries in memory)
  if (embeddingCache.size > 5000) {
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey) embeddingCache.delete(firstKey);
  }
}

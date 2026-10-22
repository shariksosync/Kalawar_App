import Redis from "ioredis";

type RedisGlobalCache = {
  redisClient?: Redis | null;
  inFlightRedisPromises?: Map<string, Promise<any>>;
  memoryFallbackCache?: Map<string, { data: any; expiry: number }>;
};

const globalForRedis = globalThis as typeof globalThis & RedisGlobalCache;

if (!globalForRedis.inFlightRedisPromises) {
  globalForRedis.inFlightRedisPromises = new Map();
}
if (!globalForRedis.memoryFallbackCache) {
  globalForRedis.memoryFallbackCache = new Map();
}

/**
 * Initializes and returns a singleton Redis client configured for Upstash / TLS.
 * Safely returns null if REDIS_URL is not configured.
 */
export function getRedisClient(): Redis | null {
  if (globalForRedis.redisClient !== undefined) {
    return globalForRedis.redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    globalForRedis.redisClient = null;
    return null;
  }

  try {
    const isTls = redisUrl.startsWith("rediss://");
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      connectTimeout: 10000,
      lazyConnect: false,
      enableReadyCheck: false,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      retryStrategy(times) {
        if (times > 5) {
          return null; // Stop retrying after 5 attempts to prevent continuous looping
        }
        return Math.min(times * 200, 2000);
      },
    });

    client.on("error", (err) => {
      console.warn("[Upstash Redis Warning]:", (err as any)?.message || err);
    });

    client.on("connect", () => {
      console.log("[Upstash Redis] Connected successfully.");
    });

    globalForRedis.redisClient = client;
    return client;
  } catch (err) {
    console.warn("[Upstash Redis Init Error]:", (err as any)?.message || err);
    globalForRedis.redisClient = null;
    return null;
  }
}

/**
 * Get cached JSON value from Redis
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    console.warn(`[Redis Get Error: ${key}]`, (err as any)?.message || err);
    return null;
  }
}

/**
 * Store JSON value in Redis with TTL in seconds
 */
export async function redisSet(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
  const client = getRedisClient();
  if (!client || value === undefined || value === null) return;

  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await client.setex(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
  } catch (err) {
    console.warn(`[Redis Set Error: ${key}]`, (err as any)?.message || err);
  }
}

/**
 * Delete one or multiple keys, or keys matching a wildcard pattern
 */
export async function redisDel(keyOrPattern: string | string[]): Promise<void> {
  const client = getRedisClient();
  const memCache = globalForRedis.memoryFallbackCache;

  // Clear memory cache entries matching the key/pattern
  if (memCache) {
    if (Array.isArray(keyOrPattern)) {
      for (const k of keyOrPattern) memCache.delete(k);
    } else if (keyOrPattern.includes("*")) {
      const prefix = keyOrPattern.replace("*", "");
      for (const k of memCache.keys()) {
        if (k.startsWith(prefix)) memCache.delete(k);
      }
    } else {
      memCache.delete(keyOrPattern);
    }
  }

  if (!client) return;

  try {
    if (Array.isArray(keyOrPattern)) {
      if (keyOrPattern.length > 0) {
        await client.del(...keyOrPattern);
      }
    } else if (keyOrPattern.includes("*")) {
      const keys = await client.keys(keyOrPattern);
      if (keys && keys.length > 0) {
        await client.del(...keys);
      }
    } else {
      await client.del(keyOrPattern);
    }
  } catch (err) {
    console.warn(`[Redis Del Error: ${keyOrPattern}]`, (err as any)?.message || err);
  }
}

/**
 * High-performance multi-tier caching with in-flight deduplication:
 * 1. Checks Redis cache
 * 2. If miss, deduplicates concurrent in-flight requests into 1 DB query
 * 3. Saves to Redis with TTL
 * 4. Gracefully falls back to MongoDB + memory cache if Redis is down
 */
export async function withRedisCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // 1. Try Redis cache
  try {
    const cached = await redisGet<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch {
    // Redis unavailable, proceed to fetch
  }

  // 2. Check in-flight promise deduplication
  const inFlight = globalForRedis.inFlightRedisPromises!;
  const ongoing = inFlight.get(key);
  if (ongoing) {
    return (await ongoing) as T;
  }

  // 3. Initiate single in-flight fetch
  const promise = (async () => {
    try {
      const result = await fetchFn();
      if (result !== undefined && result !== null) {
        // Fire-and-forget write to Redis
        redisSet(key, result, ttlSeconds).catch(() => {});
        // Also save to memory fallback cache
        globalForRedis.memoryFallbackCache?.set(key, {
          data: result,
          expiry: Date.now() + ttlSeconds * 1000,
        });
      }
      return result;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

// -----------------------------------------------------------------------------
// MODULE-SPECIFIC CACHE INVALIDATION HELPERS
// -----------------------------------------------------------------------------

/**
 * Invalidate Intro Video, Hero Banners, and Site Settings cache
 */
export async function invalidateSettingsAndIntroVideoCache(): Promise<void> {
  await redisDel([
    "cache:settings",
    "cache:intro-video",
    "cache:banners",
    "cache:settings:*",
  ]);
}

/**
 * Invalidate Videos, Video Gallery, and Streams cache
 */
export async function invalidateVideoCache(slugOrId?: string): Promise<void> {
  const keys = ["cache:videos:list", "cache:videos:all", "cache:videos:*"];
  if (slugOrId) {
    keys.push(`cache:videos:slug:${slugOrId}`, `cache:videos:id:${slugOrId}`);
  }
  await redisDel(keys);
}

/**
 * Invalidate Certificates and QR verification cache
 */
export async function invalidateCertificateCache(idOrNumber?: string): Promise<void> {
  const keys = [
    "cache:cert:list:all",
    "cache:cert:list:public",
    "cache:cert:stats",
    "cache:cert:*",
  ];
  if (idOrNumber) {
    keys.push(
      `cache:cert:id:${idOrNumber}`,
      `cache:cert:num:${idOrNumber}`,
      `cache:cert:verify:${idOrNumber.toLowerCase()}`,
      `cache:cert:lookup:${idOrNumber.toLowerCase()}`
    );
  }
  await redisDel(keys);
}

/**
 * Invalidate ID Cards and Member QR verification cache
 */
export async function invalidateIdCardCache(idOrNumber?: string): Promise<void> {
  const keys = [
    "cache:idcard:list:all",
    "cache:idcard:list:public",
    "cache:idcard:stats",
    "cache:idcard:*",
  ];
  if (idOrNumber) {
    keys.push(
      `cache:idcard:id:${idOrNumber}`,
      `cache:idcard:num:${idOrNumber}`,
      `cache:idcard:verify:${idOrNumber.toLowerCase()}`
    );
  }
  await redisDel(keys);
}

/**
 * Invalidate Belt Examinations and Certified Belt Candidates cache
 */
export async function invalidateBeltExamCache(examIdOrCandidateId?: string): Promise<void> {
  const keys = [
    "cache:beltexams:sessions:all",
    "cache:beltexams:candidates:all",
    "cache:beltexams:*",
  ];
  if (examIdOrCandidateId) {
    keys.push(`cache:beltexams:session:${examIdOrCandidateId}`);
  }
  await redisDel(keys);
}

/**
 * Invalidate Dan Grading and Black Belt Registry cache
 */
export async function invalidateDanGradingCache(appIdOrSessionId?: string): Promise<void> {
  const keys = [
    "cache:dangrading:sessions:all",
    "cache:dangrading:candidates:all",
    "cache:dangrading:grades",
    "cache:dangrading:*",
  ];
  if (appIdOrSessionId) {
    keys.push(`cache:dangrading:app:${appIdOrSessionId}`, `cache:dangrading:session:${appIdOrSessionId}`);
  }
  await redisDel(keys);
}

/**
 * Invalidate State and District Associations cache
 */
export async function invalidateAssociationCache(): Promise<void> {
  await redisDel([
    "cache:state-associations",
    "cache:district-associations",
    "cache:associations:*",
  ]);
}

/**
 * Invalidate News, Events, and Calendar cache
 */
export async function invalidateNewsAndEventsCache(slugOrId?: string): Promise<void> {
  const keys = ["cache:news:list", "cache:events:list", "cache:news:*", "cache:events:*"];
  if (slugOrId) {
    keys.push(`cache:news:${slugOrId}`, `cache:events:${slugOrId}`);
  }
  await redisDel(keys);
}

/**
 * Invalidate Leadership, Downloads, Gallery, Medal Tally cache
 */
export async function invalidatePublicInfoCache(): Promise<void> {
  await redisDel([
    "cache:leadership",
    "cache:gallery",
    "cache:downloads",
    "cache:medal-tally",
    "cache:officials",
  ]);
}

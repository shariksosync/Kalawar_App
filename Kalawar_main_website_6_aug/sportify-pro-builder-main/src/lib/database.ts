import dns from "dns";
import { MongoClient, type Db } from "mongodb";

// Configure public DNS (Google, Cloudflare) for Node.js to resolve SRV records on networks with restricted DNS
function setupPublicDNS() {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    if (typeof (dns as any).setDefaultResultOrder === "function") {
      (dns as any).setDefaultResultOrder("ipv4first");
    }
  } catch {
    // Ignore in restricted environments
  }
}

setupPublicDNS();

type MongoCache = {
  clientPromises?: Map<string, Promise<MongoClient>>;
  inFlightPromises?: Map<string, Promise<any>>;
  memoryCache?: Map<string, { data: any; expiry: number }>;
};

const globalForMongo = globalThis as typeof globalThis & MongoCache;

if (!globalForMongo.clientPromises) {
  globalForMongo.clientPromises = new Map();
}
if (!globalForMongo.inFlightPromises) {
  globalForMongo.inFlightPromises = new Map();
}
if (!globalForMongo.memoryCache) {
  globalForMongo.memoryCache = new Map();
}

/**
 * Extract database name from MONGODB_URI with fallback to 'kalawar'
 */
export function getDatabaseName(uri?: string): string {
  const targetUri = uri || process.env.MONGODB_URI || "mongodb://localhost:27017/kalawar";
  try {
    const parsed = new URL(targetUri.replace("mongodb+srv://", "http://").replace("mongodb://", "http://"));
    const path = parsed.pathname.replace(/^\//, "").split("?")[0].trim();
    if (path) return path;
  } catch {
    // Fallback regex / split parsing
  }
  const lastSegment = targetUri.split("/").pop() || "";
  const withoutQuery = lastSegment.split("?")[0].trim();
  return withoutQuery || "kalawar";
}

/**
 * Returns a globally cached MongoClient instance configured for high-concurrency environments.
 */
export async function getMongoClient(uri?: string): Promise<MongoClient> {
  setupPublicDNS();
  const targetUri = uri || process.env.MONGODB_URI;

  if (!targetUri) {
    throw new Error(
      "MongoDB connection string is missing. Please define MONGODB_URI in your environment variables."
    );
  }

  if (!globalForMongo.clientPromises) {
    globalForMongo.clientPromises = new Map();
  }

  const existing = globalForMongo.clientPromises.get(targetUri);
  if (existing) {
    return existing;
  }

  // Parse max pool size from env or default to 10 for balancing Atlas connection limits and throughput
  const maxPoolSize = process.env.MONGODB_MAX_POOL_SIZE
    ? parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10)
    : 10;

  const clientPromise = (async () => {
    const client = new MongoClient(targetUri, {
      maxPoolSize,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    return client;
  })().catch((error) => {
    globalForMongo.clientPromises?.delete(targetUri);
    console.error("[MongoDB Client Error]:", error?.message || error);
    throw error;
  });

  globalForMongo.clientPromises.set(targetUri, clientPromise);
  return clientPromise;
}

/**
 * Returns a connected Mongo Db instance
 */
export async function getDatabase(dbName?: string, uri?: string): Promise<Db> {
  const client = await getMongoClient(uri);
  const targetDbName = dbName || getDatabaseName(uri);
  return client.db(targetDbName);
}

// -------------------------------------------------------------
// CONCURRENCY CONTROL / SEMAPHORE FOR MASS USER REQUESTS
// -------------------------------------------------------------

class ConcurrencyLimiter {
  private activeCount = 0;
  private queue: Array<() => void> = [];

  constructor(private maxConcurrent: number = 20) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.maxConcurrent) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }

    this.activeCount++;
    try {
      return await fn();
    } finally {
      this.activeCount--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next) next();
      }
    }
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

// Global semaphore instance
const defaultLimiter = new ConcurrencyLimiter(
  process.env.MAX_CONCURRENT_DB_OPS ? parseInt(process.env.MAX_CONCURRENT_DB_OPS, 10) : 25
);

/**
 * Wrapper to execute database or heavy async tasks with concurrency limiting.
 * Prevents connection exhaustion during traffic spikes.
 */
export async function executeWithConcurrencyLimit<T>(
  task: () => Promise<T>,
  limiter: ConcurrencyLimiter = defaultLimiter
): Promise<T> {
  return limiter.run(task);
}

export const withDbLimit = executeWithConcurrencyLimit;

// -------------------------------------------------------------
// IN-FLIGHT DEDUPLICATION & SHORT-TTL MEMORY CACHE
// -------------------------------------------------------------

/**
 * Deduplicates in-flight requests and caches read results in memory.
 * If 100 users request the same query simultaneously, only 1 DB call is made.
 *
 * @param key Unique cache key for this query
 * @param ttlMs Time-to-live in milliseconds (e.g. 10_000 for 10 seconds)
 * @param fetchFn Async function that queries the database
 */
export async function withCacheOrFetch<T>(
  key: string,
  ttlMs: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cache = globalForMongo.memoryCache!;
  const inFlight = globalForMongo.inFlightPromises!;

  // 1. Check memory cache
  const cachedItem = cache.get(key);
  if (cachedItem && cachedItem.expiry > now) {
    return cachedItem.data as T;
  }

  // 2. Check if identical query is currently in-flight
  const ongoing = inFlight.get(key);
  if (ongoing) {
    return (await ongoing) as T;
  }

  // 3. Initiate single in-flight DB fetch
  const promise = (async () => {
    try {
      const data = await executeWithConcurrencyLimit(fetchFn);
      if (ttlMs > 0 && data !== undefined && data !== null) {
        cache.set(key, { data, expiry: Date.now() + ttlMs });
      }
      return data;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

/**
 * Invalidate cached items by exact key or regex pattern (useful on admin create/update)
 */
export function invalidateDbCache(keyOrPattern?: string | RegExp): void {
  const cache = globalForMongo.memoryCache;
  if (!cache) return;

  if (!keyOrPattern) {
    cache.clear();
    return;
  }

  if (typeof keyOrPattern === "string") {
    cache.delete(keyOrPattern);
    for (const key of cache.keys()) {
      if (key.startsWith(keyOrPattern)) {
        cache.delete(key);
      }
    }
  } else if (keyOrPattern instanceof RegExp) {
    for (const key of cache.keys()) {
      if (keyOrPattern.test(key)) {
        cache.delete(key);
      }
    }
  }
}

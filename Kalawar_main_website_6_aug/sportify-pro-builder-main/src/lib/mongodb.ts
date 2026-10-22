import dns from "dns";
import mongoose from "mongoose";

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

// Prevent all Mongoose buffering hangs across all models and schemas
mongoose.set("bufferCommands", false);
try {
  mongoose.set("bufferTimeoutMS", 2000);
} catch {}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  resolvedUri?: string;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Automatically converts a mongodb+srv:// URI into a direct replica-set seed list URI
 * if DNS SRV queries are blocked or failing on the local network/ISP.
 */
async function resolveSrvToDirectUri(uri: string): Promise<string> {
  if (!uri.startsWith("mongodb+srv://")) {
    return uri;
  }

  try {
    setupPublicDNS();
    const withoutPrefix = uri.replace("mongodb+srv://", "");
    const slashIdx = withoutPrefix.indexOf("/");
    const authAndHost = slashIdx !== -1 ? withoutPrefix.substring(0, slashIdx) : withoutPrefix;
    const rest = slashIdx !== -1 ? withoutPrefix.substring(slashIdx + 1) : "";

    const atIdx = authAndHost.lastIndexOf("@");
    const credentials = atIdx !== -1 ? authAndHost.substring(0, atIdx + 1) : "";
    const hostname = atIdx !== -1 ? authAndHost.substring(atIdx + 1) : authAndHost;

    const srvRecords = await dns.promises.resolveSrv(`_mongodb._tcp.${hostname}`);
    if (!srvRecords || srvRecords.length === 0) {
      return uri;
    }

    const hostList = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
    const dbName = rest.split("?")[0] || "kalawar";

    let extraParams = "ssl=true&authSource=admin&retryWrites=true&w=majority";
    try {
      const txtRecords = await dns.promises.resolveTxt(hostname);
      if (txtRecords && txtRecords.length > 0) {
        const txtStr = txtRecords.flat().join("&");
        if (txtStr) {
          extraParams = `ssl=true&${txtStr}&retryWrites=true&w=majority`;
        }
      }
    } catch {
      // fallback to standard params
    }

    return `mongodb://${credentials}${hostList}/${dbName}?${extraParams}`;
  } catch (err) {
    console.warn("[MongoDB] SRV direct conversion note:", (err as any)?.message || err);
    return uri;
  }
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  setupPublicDNS();

  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const rawUri = process.env.MONGODB_URI;

    if (!rawUri || process.env.MOCK_DATA === "true" || process.env.DEMO_MODE === "true") {
      throw new Error(
        "MOCK_MODE_ACTIVE: Database connection disabled. Using mock data and local storage."
      );
    }

    const maxPoolSize = process.env.MONGODB_MAX_POOL_SIZE
      ? parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10)
      : 10;

    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    };

    cached.promise = (async () => {
      setupPublicDNS();

      // If we already resolved a working direct URI previously, try it first
      const targetUri = cached.resolvedUri || rawUri;

      try {
        const instance = await mongoose.connect(targetUri, opts);
        return instance;
      } catch (firstErr: any) {
        const errMsg = firstErr?.message || String(firstErr);
        const isDnsOrSrvError =
          errMsg.includes("querySrv") ||
          errMsg.includes("ECONNREFUSED") ||
          errMsg.includes("ENOTFOUND") ||
          errMsg.includes("ETIMEDOUT");

        if (rawUri.startsWith("mongodb+srv://") && isDnsOrSrvError) {
          try {
            const directUri = await resolveSrvToDirectUri(rawUri);
            if (directUri !== rawUri) {
              const directInstance = await mongoose.connect(directUri, opts);
              cached.resolvedUri = directUri;
              return directInstance;
            }
          } catch (retryErr: any) {
            console.error("MongoDB direct retry error:", retryErr?.message || retryErr);
          }
        }

        console.error("MongoDB connection error:", errMsg);
        throw firstErr;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// Re-export high-concurrency helpers
export {
  executeWithConcurrencyLimit,
  withDbLimit,
  withCacheOrFetch,
  invalidateDbCache,
} from "./database";

export default connectToDatabase;

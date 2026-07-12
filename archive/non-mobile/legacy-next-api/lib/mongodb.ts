import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const globalCache = globalThis.mongooseCache ?? {
  conn: null,
  promise: null
};

globalThis.mongooseCache = globalCache;

export async function connectMongo() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("缺少 MONGODB_URI 环境变量");
  }

  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      appName: "boss-shujuzonglan1-web",
      maxPoolSize: 5,
      minPoolSize: 0,
      maxIdleTimeMS: 60_000,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000
    });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}

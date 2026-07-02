import mongoose from "mongoose";
import { getEnv } from "../config/env.js";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalCache = globalThis as typeof globalThis & {
  bossShujuMongooseCache?: MongooseCache;
};

const mongooseCache = globalCache.bossShujuMongooseCache ?? {
  conn: null,
  promise: null
};

globalCache.bossShujuMongooseCache = mongooseCache;

export async function connectMongo() {
  if (mongooseCache.conn) return mongooseCache.conn;

  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose.connect(getEnv().mongoUri, {
      bufferCommands: false,
      appName: "boss-shuju-backend",
      maxPoolSize: 5,
      minPoolSize: 0,
      maxIdleTimeMS: 60_000,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000
    });
  }

  mongooseCache.conn = await mongooseCache.promise;
  return mongooseCache.conn;
}


import mongoose from "mongoose";
import { syncPlanCatalog } from "./seed";

type MongoCache = {
  connection: typeof mongoose | null;
  connectionPromise: Promise<typeof mongoose> | null;
  catalogPromise: Promise<void> | null;
};

const globalMongo = globalThis as typeof globalThis & { mongoCache?: MongoCache };
const cache = (globalMongo.mongoCache ??= { connection: null, connectionPromise: null, catalogPromise: null });

export async function connectDatabase() {
  if (!cache.connection) {
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) throw new Error("MONGODB_URI is not configured");
    cache.connectionPromise ??= mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB?.trim() || "upgrading_skills",
      serverSelectionTimeoutMS: 10_000,
    });
    cache.connection = await cache.connectionPromise;
  }
  cache.catalogPromise ??= syncPlanCatalog();
  await cache.catalogPromise;
  return cache.connection;
}

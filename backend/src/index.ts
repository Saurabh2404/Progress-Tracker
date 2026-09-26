import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import { MongoMemoryServer } from "mongodb-memory-server";
import { publishUpdate, subscribeToUpdates } from "./lib/realtime.js";
import { syncPlanCatalog } from "./lib/seed.js";
import { sprintRouter } from "./routes/sprints.js";
import { taskRouter } from "./routes/tasks.js";

dotenv.config();

const port = Number(process.env.PORT ?? 4000);
const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_request, response) => response.redirect("/api/health"));

app.get("/api/health", (_request, response) =>
  response.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    storage: process.env.MONGODB_URI?.trim() ? "mongodb" : "development",
  }),
);
app.get("/api/events", (request, response) => {
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.flushHeaders();
  response.write("event: ready\ndata: {}\n\n");

  const unsubscribe = subscribeToUpdates(() => {
    response.write(`event: refresh\ndata: {"at":${Date.now()}}\n\n`);
  });
  const heartbeat = setInterval(() => response.write(": heartbeat\n\n"), 25_000);

  request.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});
app.use("/api/sprints", sprintRouter);
app.use("/api/tasks", taskRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ message: "Something went wrong. Please try again." });
});

async function start() {
  const databaseName = process.env.MONGODB_DB?.trim() || "upgrading_skills";
  let mongoUri = process.env.MONGODB_URI?.trim();
  let developmentMongo: MongoMemoryServer | undefined;

  if (!mongoUri) {
    developmentMongo = await MongoMemoryServer.create({ instance: { dbName: databaseName } });
    mongoUri = developmentMongo.getUri();
    console.log("Using the bundled development MongoDB instance.");
  }

  await mongoose.connect(mongoUri, { dbName: databaseName, serverSelectionTimeoutMS: 10_000 });
  console.log(`MongoDB connected (${databaseName}).`);
  await syncPlanCatalog();

  if (process.env.MONGODB_URI?.trim()) {
    const changeStream = mongoose.connection.watch();
    changeStream.on("change", publishUpdate);
    changeStream.on("error", (error) => {
      console.warn("MongoDB live updates unavailable; app-originated updates still sync.", error.message);
    });
  }

  const server = app.listen(port, () => console.log(`API ready at http://localhost:${port}`));

  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    await developmentMongo?.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((error) => {
  console.error("Unable to start the API", error);
  process.exit(1);
});

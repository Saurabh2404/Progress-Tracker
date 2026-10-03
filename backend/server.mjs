import express from "express";
import next from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(directory, "../frontend");
const development = process.env.NODE_ENV !== "production" && process.env.npm_lifecycle_event !== "start";
const hostname = process.env.HOSTNAME || "localhost";
const port = Number(process.env.PORT || 3000);

const nextApplication = next({ dev: development, dir: frontendDirectory, hostname, port });
const handleNextRequest = nextApplication.getRequestHandler();

await nextApplication.prepare();

const server = express();
server.disable("x-powered-by");
server.set("trust proxy", 1);

server.get("/express/health", (_request, response) => {
  response.json({ status: "ok", runtime: "express", application: "next" });
});

server.use((request, response) => handleNextRequest(request, response));

server.listen(port, hostname, () => {
  console.log(`Upgrading Skills is ready at http://${hostname}:${port}`);
});

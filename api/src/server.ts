import { app } from "./app";
import { connectDB } from "./db/sequelize";
import { validateEnv, env } from "./config/env";
import { initModels } from "./models";
import { startReservationExpiryWorker } from "./workers/reservationExpiry.worker";
import { initSocket } from "./realtime/socket";
import http from "node:http";

async function start() {
  validateEnv();
  const sequelize = await connectDB();
  initModels(sequelize);

  const stopExpiryWorker = startReservationExpiryWorker({ intervalMs: env.expiryPollMs });

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  const server = httpServer.listen(env.port, () => {
    console.log(`API listening on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    stopExpiryWorker();
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

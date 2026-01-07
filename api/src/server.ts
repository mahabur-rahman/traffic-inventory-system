import { app } from "./app";
import { connectDB } from "./db/sequelize";
import { validateEnv, env } from "./config/env";
import { initModels } from "./models";

async function start() {
  validateEnv();
  const sequelize = await connectDB();
  initModels(sequelize);

  const server = app.listen(env.port, () => {
    console.log(`API listening on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});


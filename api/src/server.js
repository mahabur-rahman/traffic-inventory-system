const { app } = require("./app");
const { validateEnv, env } = require("./config/env");
const { connectDB } = require("./config/database");
const { initModels } = require("./models");

async function start() {
  validateEnv();
  const sequelize = await connectDB();
  initModels(sequelize);

  const server = app.listen(env.port, () => {
    console.log(`API listening on port ${env.port} (${env.nodeEnv})`);
  });

  function shutdown(signal) {
    console.log(`Received ${signal}, shutting down...`);
    server.close(() => process.exit(0));
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

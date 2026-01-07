const { Sequelize } = require("sequelize");
const { env } = require("./env");

let sequelize;

function getSequelize() {
  if (sequelize) return sequelize;
  if (!env.databaseUrl) {
    const error = new Error("DATABASE_URL is not set");
    error.code = "DB_NOT_CONFIGURED";
    throw error;
  }

  sequelize = new Sequelize(env.databaseUrl, {
    dialect: "postgres",
    logging: env.nodeEnv === "development" ? console.log : false,
    dialectOptions: env.dbSsl
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : undefined,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });

  return sequelize;
}

async function connectDB() {
  const instance = getSequelize();
  await instance.authenticate();
  return instance;
}

module.exports = { getSequelize, connectDB };

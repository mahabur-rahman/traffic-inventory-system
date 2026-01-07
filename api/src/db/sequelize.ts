import { Sequelize } from "sequelize";

import { env } from "../config/env";

let sequelize: Sequelize | undefined;

export function getSequelize() {
  if (sequelize) return sequelize;
  if (!env.databaseUrl) {
    const error = new Error("DATABASE_URL is not set");
    (error as any).code = "DB_NOT_CONFIGURED";
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

export async function connectDB() {
  const instance = getSequelize();
  await instance.authenticate();
  return instance;
}


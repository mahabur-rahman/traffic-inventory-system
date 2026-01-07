import path from "node:path";

import dotenv from "dotenv";

dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || path.join(process.cwd(), ".env")
});

function toBool(value: unknown, defaultValue: boolean) {
  if (value === undefined) return defaultValue;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function toInt(value: unknown, defaultValue: number) {
  if (value === undefined || value === "") return defaultValue;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toInt(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL,
  dbSsl: toBool(process.env.DB_SSL, true)
};

export function validateEnv() {
  const missing: string[] = [];
  if (!env.databaseUrl) missing.push("DATABASE_URL");
  if (missing.length) {
    const error = new Error(`Missing required env vars: ${missing.join(", ")}`);
    (error as any).missing = missing;
    throw error;
  }
  return env;
}


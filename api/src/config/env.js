const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || path.join(process.cwd(), ".env")
});

function toBool(value, defaultValue) {
  if (value === undefined) return defaultValue;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function toInt(value, defaultValue) {
  if (value === undefined || value === "") return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toInt(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL,
  dbSsl: toBool(process.env.DB_SSL, true)
};

function validateEnv() {
  const missing = [];
  if (!env.databaseUrl) missing.push("DATABASE_URL");
  if (missing.length) {
    const error = new Error(`Missing required env vars: ${missing.join(", ")}`);
    error.missing = missing;
    throw error;
  }
  return env;
}

module.exports = { env, validateEnv };


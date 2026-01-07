require("dotenv").config();

const useSsl = (process.env.DB_SSL ?? "true").toLowerCase() !== "false";

const shared = {
  dialect: "postgres",
  url: process.env.DATABASE_URL,
  dialectOptions: useSsl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : undefined
};

module.exports = {
  development: shared,
  test: shared,
  production: shared
};


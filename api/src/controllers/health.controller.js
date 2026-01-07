const { getSequelize } = require("../config/database");

async function health(req, res) {
  let db = "down";
  try {
    const sequelize = getSequelize();
    await sequelize.authenticate();
    db = "up";
  } catch (err) {
    db = err.code === "DB_NOT_CONFIGURED" ? "not_configured" : "down";
  }

  res.json({
    ok: true,
    service: "api",
    uptime: process.uptime(),
    db
  });
}

module.exports = { health };

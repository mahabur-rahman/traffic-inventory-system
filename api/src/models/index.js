const { DataTypes } = require("sequelize");
const defineUser = require("./User");

function initModels(sequelize) {
  const User = defineUser(sequelize, DataTypes);
  return { User };
}

module.exports = { initModels };

import type { Sequelize } from "sequelize";
import { DataTypes } from "sequelize";

import { defineUser } from "./User";

export function initModels(sequelize: Sequelize) {
  const User = defineUser(sequelize, DataTypes);
  return { User };
}


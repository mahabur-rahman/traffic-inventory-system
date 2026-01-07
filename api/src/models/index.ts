import type { Sequelize } from "sequelize";
import { DataTypes } from "sequelize";

import { defineUser } from "./User";

export type Models = {
  User: ReturnType<typeof defineUser>;
};

let models: Models | null = null;

export function initModels(sequelize: Sequelize): Models {
  const User = defineUser(sequelize, DataTypes);
  models = { User };
  return models;
}

export function getModels() {
  if (!models) {
    throw new Error("Models not initialized");
  }
  return models;
}

import type { Sequelize } from "sequelize";
import { DataTypes } from "sequelize";

import { defineUser } from "./User";
import { defineDrop } from "./Drop";
import { defineReservation } from "./Reservation";
import { definePurchase } from "./Purchase";

export type Models = {
  User: ReturnType<typeof defineUser>;
  Drop: ReturnType<typeof defineDrop>;
  Reservation: ReturnType<typeof defineReservation>;
  Purchase: ReturnType<typeof definePurchase>;
};

let models: Models | null = null;

export function initModels(sequelize: Sequelize): Models {
  const User = defineUser(sequelize, DataTypes);
  const Drop = defineDrop(sequelize, DataTypes);
  const Reservation = defineReservation(sequelize, DataTypes);
  const Purchase = definePurchase(sequelize, DataTypes);

  (User as any).hasMany(Drop, { as: "createdDrops", foreignKey: "createdBy" });
  (Drop as any).belongsTo(User, { as: "creator", foreignKey: "createdBy" });

  (User as any).hasMany(Reservation, { as: "reservations", foreignKey: "userId" });
  (Drop as any).hasMany(Reservation, { as: "reservations", foreignKey: "dropId" });
  (Reservation as any).belongsTo(User, { as: "user", foreignKey: "userId" });
  (Reservation as any).belongsTo(Drop, { as: "drop", foreignKey: "dropId" });

  (User as any).hasMany(Purchase, { as: "purchases", foreignKey: "userId" });
  (Drop as any).hasMany(Purchase, { as: "purchases", foreignKey: "dropId" });
  (Purchase as any).belongsTo(User, { as: "user", foreignKey: "userId" });
  (Purchase as any).belongsTo(Drop, { as: "drop", foreignKey: "dropId" });

  (Reservation as any).hasOne(Purchase, { as: "purchase", foreignKey: "reservationId" });
  (Purchase as any).belongsTo(Reservation, { as: "reservation", foreignKey: "reservationId" });

  models = { User, Drop, Reservation, Purchase };
  return models;
}

export function getModels() {
  if (!models) {
    throw new Error("Models not initialized");
  }
  return models;
}

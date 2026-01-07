import type { Sequelize } from "sequelize";

export function defineReservation(
  sequelize: Sequelize,
  dataTypes: typeof import("sequelize").DataTypes
) {
  return sequelize.define(
    "Reservation",
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: dataTypes.UUID,
        allowNull: false,
        field: "user_id"
      },
      dropId: {
        type: dataTypes.UUID,
        allowNull: false,
        field: "drop_id"
      },
      status: {
        type: dataTypes.STRING(32),
        allowNull: false,
        defaultValue: "ACTIVE"
      },
      expiresAt: {
        type: dataTypes.DATE,
        allowNull: true,
        field: "expires_at"
      }
    },
    {
      tableName: "reservations",
      underscored: false,
      timestamps: true
    }
  );
}

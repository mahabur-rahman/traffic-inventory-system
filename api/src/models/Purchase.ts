import type { Sequelize } from "sequelize";

export function definePurchase(
  sequelize: Sequelize,
  dataTypes: typeof import("sequelize").DataTypes
) {
  return sequelize.define(
    "Purchase",
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: dataTypes.UUID,
        allowNull: false
      },
      dropId: {
        type: dataTypes.UUID,
        allowNull: false
      },
      reservationId: {
        type: dataTypes.UUID,
        allowNull: true,
        unique: true
      },
      quantity: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 }
      },
      amountCents: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
      },
      currency: {
        type: dataTypes.STRING(3),
        allowNull: false,
        defaultValue: "USD"
      },
      status: {
        type: dataTypes.STRING(32),
        allowNull: false,
        defaultValue: "pending"
      },
      provider: {
        type: dataTypes.STRING(50),
        allowNull: false,
        defaultValue: "manual"
      },
      providerRef: {
        type: dataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: "purchases",
      underscored: true,
      timestamps: true
    }
  );
}


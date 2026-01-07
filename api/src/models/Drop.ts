import type { Sequelize } from "sequelize";

export function defineDrop(
  sequelize: Sequelize,
  dataTypes: typeof import("sequelize").DataTypes
) {
  return sequelize.define(
    "Drop",
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: dataTypes.STRING(200),
        allowNull: false
      },
      description: {
        type: dataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: dataTypes.STRING(32),
        allowNull: false,
        defaultValue: "draft"
      },
      startsAt: {
        type: dataTypes.DATE,
        allowNull: true
      },
      endsAt: {
        type: dataTypes.DATE,
        allowNull: true
      },
      currency: {
        type: dataTypes.STRING(3),
        allowNull: false,
        defaultValue: "USD"
      },
      price: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      totalStock: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      availableStock: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdBy: {
        type: dataTypes.UUID,
        allowNull: false
      }
    },
    {
      tableName: "drops",
      underscored: true,
      timestamps: true
    }
  );
}

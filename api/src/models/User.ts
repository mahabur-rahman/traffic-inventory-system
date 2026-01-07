import type { Sequelize } from "sequelize";

export function defineUser(
  sequelize: Sequelize,
  dataTypes: typeof import("sequelize").DataTypes
) {
  return sequelize.define(
    "User",
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true
      },
      username: {
        type: dataTypes.STRING(50),
        allowNull: false,
        unique: true
      }
    },
    {
      tableName: "users",
      underscored: false,
      timestamps: true
    }
  );
}

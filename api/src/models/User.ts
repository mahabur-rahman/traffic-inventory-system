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
      email: {
        type: dataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      }
    },
    {
      tableName: "users",
      underscored: true,
      timestamps: true
    }
  );
}

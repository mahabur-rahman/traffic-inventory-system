import { DataTypes } from "sequelize";
import type { QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }) {
  await context.createTable("users", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await context.dropTable("users");
}

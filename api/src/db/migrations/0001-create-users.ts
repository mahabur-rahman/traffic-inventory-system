import { DataTypes } from "sequelize";
import type { QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }) {
  await context.createTable("users", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: (context as any).sequelize.literal("NOW()")
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: (context as any).sequelize.literal("NOW()")
    }
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await context.dropTable("users");
}

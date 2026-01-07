import { DataTypes, Op } from "sequelize";
import type { QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }) {
  await context.createTable("drops", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "draft" },
    starts_at: { type: DataTypes.DATE, allowNull: true },
    ends_at: { type: DataTypes.DATE, allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "USD" },
    price_cents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    total_quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE"
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

  await context.addConstraint("drops", {
    type: "check",
    name: "drops_price_cents_non_negative",
    fields: ["price_cents"],
    where: { price_cents: { [Op.gte]: 0 } }
  });
  await context.addConstraint("drops", {
    type: "check",
    name: "drops_total_quantity_non_negative",
    fields: ["total_quantity"],
    where: { total_quantity: { [Op.gte]: 0 } }
  });

  await context.addIndex("drops", ["created_by"]);
  await context.addIndex("drops", ["status"]);
  await context.addIndex("drops", ["starts_at"]);

  await context.createTable("reservations", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    drop_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "drops", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "active" },
    expires_at: { type: DataTypes.DATE, allowNull: true },
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

  await context.addConstraint("reservations", {
    type: "check",
    name: "reservations_quantity_positive",
    fields: ["quantity"],
    where: { quantity: { [Op.gt]: 0 } }
  });

  await context.addIndex("reservations", ["user_id"]);
  await context.addIndex("reservations", ["drop_id"]);
  await context.addIndex("reservations", ["status"]);

  await context.createTable("purchases", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE"
    },
    drop_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "drops", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE"
    },
    reservation_id: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
      references: { model: "reservations", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE"
    },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    amount_cents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: "USD" },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "pending" },
    provider: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "manual" },
    provider_ref: { type: DataTypes.STRING(255), allowNull: true },
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

  await context.addConstraint("purchases", {
    type: "check",
    name: "purchases_quantity_positive",
    fields: ["quantity"],
    where: { quantity: { [Op.gt]: 0 } }
  });
  await context.addConstraint("purchases", {
    type: "check",
    name: "purchases_amount_cents_non_negative",
    fields: ["amount_cents"],
    where: { amount_cents: { [Op.gte]: 0 } }
  });

  await context.addIndex("purchases", ["user_id"]);
  await context.addIndex("purchases", ["drop_id"]);
  await context.addIndex("purchases", ["status"]);
}

export async function down({ context }: { context: QueryInterface }) {
  await context.dropTable("purchases");
  await context.dropTable("reservations");
  await context.dropTable("drops");
}

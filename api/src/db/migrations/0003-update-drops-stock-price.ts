import { DataTypes, Op } from "sequelize";
import type { QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }) {
  await context.renameColumn("drops", "title", "name");
  await context.renameColumn("drops", "price_cents", "price");
  await context.renameColumn("drops", "total_quantity", "total_stock");

  await context.addColumn("drops", "available_stock", {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  });

  await context.sequelize.query(`UPDATE drops SET available_stock = total_stock WHERE available_stock = 0`);

  await context.removeConstraint("drops", "drops_price_cents_non_negative").catch(() => undefined);
  await context.removeConstraint("drops", "drops_total_quantity_non_negative").catch(() => undefined);

  await context.addConstraint("drops", {
    type: "check",
    name: "drops_price_non_negative",
    fields: ["price"],
    where: { price: { [Op.gte]: 0 } }
  });

  await context.addConstraint("drops", {
    type: "check",
    name: "drops_total_stock_non_negative",
    fields: ["total_stock"],
    where: { total_stock: { [Op.gte]: 0 } }
  });

  await context.addConstraint("drops", {
    type: "check",
    name: "drops_available_stock_non_negative",
    fields: ["available_stock"],
    where: { available_stock: { [Op.gte]: 0 } }
  });

  await context.addConstraint("drops", {
    type: "check",
    name: "drops_available_stock_lte_total_stock",
    fields: ["available_stock", "total_stock"],
    where: (context as any).sequelize.literal("available_stock <= total_stock") as any
  });

  await context.addIndex("drops", ["ends_at"]);
  await context.addIndex("drops", ["available_stock"]);
  await context.addIndex("drops", ["status", "starts_at"]);
}

export async function down({ context }: { context: QueryInterface }) {
  await context.removeIndex("drops", ["status", "starts_at"]).catch(() => undefined);
  await context.removeIndex("drops", ["available_stock"]).catch(() => undefined);
  await context.removeIndex("drops", ["ends_at"]).catch(() => undefined);

  await context.removeConstraint("drops", "drops_available_stock_lte_total_stock").catch(() => undefined);
  await context.removeConstraint("drops", "drops_available_stock_non_negative").catch(() => undefined);
  await context.removeConstraint("drops", "drops_total_stock_non_negative").catch(() => undefined);
  await context.removeConstraint("drops", "drops_price_non_negative").catch(() => undefined);

  await context.removeColumn("drops", "available_stock");

  await context.renameColumn("drops", "total_stock", "total_quantity");
  await context.renameColumn("drops", "price", "price_cents");
  await context.renameColumn("drops", "name", "title");

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
}


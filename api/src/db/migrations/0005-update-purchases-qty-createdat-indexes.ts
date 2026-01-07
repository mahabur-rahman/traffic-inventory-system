import { DataTypes, Op } from "sequelize";
import type { QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }) {
  await context.renameColumn("purchases", "created_at", "createdAt");
  await context.renameColumn("purchases", "updated_at", "updatedAt");

  // qty column (default 1)
  await context.removeConstraint("purchases", "purchases_quantity_positive").catch(() => undefined);
  await context.renameColumn("purchases", "quantity", "qty");
  await context.changeColumn("purchases", "qty", {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  });
  await context.addConstraint("purchases", {
    type: "check",
    name: "purchases_qty_positive",
    fields: ["qty"],
    where: { qty: { [Op.gt]: 0 } }
  });

  // createdAt default
  await context.changeColumn("purchases", "createdAt", {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  });

  // Indexes for latest purchasers (common queries)
  await context.addIndex("purchases", {
    name: "purchases_drop_createdat_idx",
    fields: ["drop_id", "createdAt"]
  });
  await context.addIndex("purchases", {
    name: "purchases_user_createdat_idx",
    fields: ["user_id", "createdAt"]
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await context.removeIndex("purchases", "purchases_user_createdat_idx").catch(() => undefined);
  await context.removeIndex("purchases", "purchases_drop_createdat_idx").catch(() => undefined);

  await context.changeColumn("purchases", "createdAt", {
    type: DataTypes.DATE,
    allowNull: false
  });

  await context.removeConstraint("purchases", "purchases_qty_positive").catch(() => undefined);
  await context.renameColumn("purchases", "qty", "quantity");
  await context.addConstraint("purchases", {
    type: "check",
    name: "purchases_quantity_positive",
    fields: ["quantity"],
    where: { quantity: { [Op.gt]: 0 } }
  });

  await context.renameColumn("purchases", "createdAt", "created_at");
  await context.renameColumn("purchases", "updatedAt", "updated_at");
}

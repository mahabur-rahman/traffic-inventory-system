import { DataTypes, Op } from "sequelize";
import type { QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }) {
  // Align timestamps to Sequelize defaults naming (createdAt/updatedAt)
  await context.renameColumn("reservations", "created_at", "createdAt");
  await context.renameColumn("reservations", "updated_at", "updatedAt");

  // Ensure required columns exist (older migration included quantity; keep it optional by removing if present)
  const table = await context.describeTable("reservations");
  if (table.quantity) {
    await context.removeConstraint("reservations", "reservations_quantity_positive").catch(() => undefined);
    await context.removeColumn("reservations", "quantity");
  }

  // Expiry scanning indexes (Postgres)
  await context.addIndex("reservations", ["expires_at"], {
    name: "reservations_expires_at_idx",
    where: { expires_at: { [Op.ne]: null } }
  });
  await context.addIndex("reservations", ["status", "expires_at"], {
    name: "reservations_status_expires_at_idx",
    where: { expires_at: { [Op.ne]: null } }
  });
  await context.addIndex("reservations", ["drop_id", "status", "expires_at"], {
    name: "reservations_drop_status_expires_at_idx",
    where: { expires_at: { [Op.ne]: null } }
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await context.removeIndex("reservations", "reservations_drop_status_expires_at_idx").catch(() => undefined);
  await context.removeIndex("reservations", "reservations_status_expires_at_idx").catch(() => undefined);
  await context.removeIndex("reservations", "reservations_expires_at_idx").catch(() => undefined);

  // Re-add quantity with default 1
  const table = await context.describeTable("reservations");
  if (!table.quantity) {
    await context.addColumn("reservations", "quantity", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
    await context.addConstraint("reservations", {
      type: "check",
      name: "reservations_quantity_positive",
      fields: ["quantity"],
      where: { quantity: { [Op.gt]: 0 } }
    });
  }

  await context.renameColumn("reservations", "createdAt", "created_at");
  await context.renameColumn("reservations", "updatedAt", "updated_at");
}

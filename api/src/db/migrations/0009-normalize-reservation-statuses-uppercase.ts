import { Op } from "sequelize";
import type { QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }) {
  await context.removeConstraint("reservations", "reservations_status_valid").catch(() => undefined);
  await context.removeIndex("reservations", "reservations_user_drop_active_unique").catch(() => undefined);

  await context.sequelize.query(`
    UPDATE reservations
    SET status = CASE lower(status)
      WHEN 'active' THEN 'ACTIVE'
      WHEN 'expired' THEN 'EXPIRED'
      WHEN 'cancelled' THEN 'CANCELLED'
      WHEN 'canceled' THEN 'CANCELLED'
      WHEN 'consumed' THEN 'CONSUMED'
      WHEN 'fulfilled' THEN 'FULFILLED'
      ELSE status
    END
  `);

  await context.changeColumn("reservations", "status", {
    type: "VARCHAR(32)",
    allowNull: false,
    defaultValue: "ACTIVE"
  } as any);

  await context.addConstraint("reservations", {
    type: "check",
    name: "reservations_status_valid",
    fields: ["status"],
    where: { status: { [Op.in]: ["ACTIVE", "EXPIRED", "CANCELLED", "CONSUMED", "FULFILLED"] } }
  });

  await context.addIndex("reservations", {
    name: "reservations_user_drop_active_unique",
    unique: true,
    fields: ["user_id", "drop_id"],
    where: { status: "ACTIVE" }
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await context.removeIndex("reservations", "reservations_user_drop_active_unique").catch(() => undefined);
  await context.removeConstraint("reservations", "reservations_status_valid").catch(() => undefined);

  await context.sequelize.query(`
    UPDATE reservations
    SET status = CASE upper(status)
      WHEN 'ACTIVE' THEN 'active'
      WHEN 'EXPIRED' THEN 'expired'
      WHEN 'CANCELLED' THEN 'cancelled'
      WHEN 'CONSUMED' THEN 'consumed'
      WHEN 'FULFILLED' THEN 'fulfilled'
      ELSE status
    END
  `);

  await context.changeColumn("reservations", "status", {
    type: "VARCHAR(32)",
    allowNull: false,
    defaultValue: "active"
  } as any);

  await context.addConstraint("reservations", {
    type: "check",
    name: "reservations_status_valid",
    fields: ["status"],
    where: { status: { [Op.in]: ["active", "expired", "cancelled", "fulfilled", "consumed"] } }
  });

  await context.addIndex("reservations", {
    name: "reservations_user_drop_active_unique",
    unique: true,
    fields: ["user_id", "drop_id"],
    where: { status: "active" }
  });
}


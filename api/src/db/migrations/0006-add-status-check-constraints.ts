import { Op } from "sequelize";
import type { QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }) {
  // Drops status
  await context.addConstraint("drops", {
    type: "check",
    name: "drops_status_valid",
    fields: ["status"],
    where: { status: { [Op.in]: ["draft", "scheduled", "live", "ended", "cancelled"] } }
  });

  // Reservations status
  await context.addConstraint("reservations", {
    type: "check",
    name: "reservations_status_valid",
    fields: ["status"],
    where: { status: { [Op.in]: ["active", "expired", "cancelled", "fulfilled"] } }
  });

  // Purchases status
  await context.addConstraint("purchases", {
    type: "check",
    name: "purchases_status_valid",
    fields: ["status"],
    where: { status: { [Op.in]: ["pending", "paid", "failed", "cancelled", "refunded"] } }
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await context.removeConstraint("purchases", "purchases_status_valid").catch(() => undefined);
  await context.removeConstraint("reservations", "reservations_status_valid").catch(() => undefined);
  await context.removeConstraint("drops", "drops_status_valid").catch(() => undefined);
}


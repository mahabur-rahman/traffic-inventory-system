import { Op } from "sequelize";
import type { QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }) {
  await context.removeConstraint("reservations", "reservations_status_valid").catch(() => undefined);
  await context.addConstraint("reservations", {
    type: "check",
    name: "reservations_status_valid",
    fields: ["status"],
    where: { status: { [Op.in]: ["active", "expired", "cancelled", "fulfilled", "consumed"] } }
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await context.removeConstraint("reservations", "reservations_status_valid").catch(() => undefined);
  await context.addConstraint("reservations", {
    type: "check",
    name: "reservations_status_valid",
    fields: ["status"],
    where: { status: { [Op.in]: ["active", "expired", "cancelled", "fulfilled"] } }
  });
}


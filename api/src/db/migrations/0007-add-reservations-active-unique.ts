import type { QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }) {
  await context.addIndex("reservations", {
    name: "reservations_user_drop_active_unique",
    unique: true,
    fields: ["user_id", "drop_id"],
    where: { status: "active" }
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await context.removeIndex("reservations", "reservations_user_drop_active_unique").catch(() => undefined);
}


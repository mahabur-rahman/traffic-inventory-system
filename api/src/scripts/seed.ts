import crypto from "node:crypto";

import { QueryTypes } from "sequelize";

import { validateEnv, env } from "../config/env";
import { connectDB } from "../db/sequelize";
import { initModels } from "../models";
import { logger } from "../logger";

async function assertSchemaReady(sequelize: any) {
  const rows = (await sequelize.query(
    `SELECT 
      to_regclass('public.users') AS users,
      to_regclass('public.drops') AS drops,
      to_regclass('public.reservations') AS reservations,
      to_regclass('public.purchases') AS purchases
    `,
    { type: QueryTypes.SELECT, logging: false }
  )) as Array<{
    users: string | null;
    drops: string | null;
    reservations: string | null;
    purchases: string | null;
  }>;

  const r = rows[0];
  const missing = Object.entries(r)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length) {
    throw new Error(
      `DB schema not ready (missing: ${missing.join(", ")}). Run \`npm run db:migrate\` first.`
    );
  }
}

async function main() {
  validateEnv();

  const reset = process.argv.includes("--reset");
  if (reset && env.nodeEnv !== "development") {
    throw new Error("Refusing to reset seed data unless NODE_ENV=development");
  }

  const sequelize = await connectDB();
  const { User, Drop, Reservation, Purchase } = initModels(sequelize);

  await assertSchemaReady(sequelize);

  if (reset) {
    logger.warn("Resetting seed data (TRUNCATE users/drops/reservations/purchases)...");
    await sequelize.query(
      `TRUNCATE TABLE purchases, reservations, drops, users RESTART IDENTITY CASCADE`,
      { logging: false }
    );
  }

  const now = Date.now();
  const minutes = (m: number) => new Date(now + m * 60_000);

  async function ensureUser(username: string) {
    const [user] = await (User as any).findOrCreate({
      where: { username },
      defaults: { id: crypto.randomUUID(), username }
    });
    const plain = user.get ? user.get({ plain: true }) : user;
    return { id: plain.id as string, username: plain.username as string };
  }

  const admin = await ensureUser("admin");
  const alice = await ensureUser("alice");
  const bob = await ensureUser("bob");
  const charlie = await ensureUser("charlie");

  // Drops
  const dropA = await (Drop as any).create({
    id: crypto.randomUUID(),
    name: "Air Jordan 1 (Seed)",
    price: 5000,
    totalStock: 5,
    availableStock: 2,
    startsAt: null,
    endsAt: null,
    status: "live",
    currency: "USD",
    createdBy: admin.id
  });

  const dropB = await (Drop as any).create({
    id: crypto.randomUUID(),
    name: "Yeezy (Scheduled Seed)",
    price: 7000,
    totalStock: 3,
    availableStock: 3,
    startsAt: minutes(10),
    endsAt: minutes(60),
    status: "scheduled",
    currency: "USD",
    createdBy: admin.id
  });

  const dropC = await (Drop as any).create({
    id: crypto.randomUUID(),
    name: "Dunk Low (Expiry Demo Seed)",
    price: 4000,
    totalStock: 4,
    availableStock: 3,
    startsAt: minutes(-30),
    endsAt: null,
    status: "live",
    currency: "USD",
    createdBy: admin.id
  });

  // Reservations: Drop A has 1 ACTIVE reservation (stock already decremented in availableStock=2)
  const activeReservationA = await (Reservation as any).create({
    id: crypto.randomUUID(),
    userId: bob.id,
    dropId: dropA.id,
    status: "ACTIVE",
    expiresAt: minutes(1)
  });

  // Purchases: Drop A has 2 paid purchases (stock already deducted at reserve time, included in availableStock=2)
  const consumedReservation1 = await (Reservation as any).create({
    id: crypto.randomUUID(),
    userId: alice.id,
    dropId: dropA.id,
    status: "CONSUMED",
    expiresAt: minutes(5)
  });
  await (Purchase as any).create({
    id: crypto.randomUUID(),
    userId: alice.id,
    dropId: dropA.id,
    reservationId: consumedReservation1.id,
    qty: 1,
    amountCents: 5000,
    currency: "USD",
    status: "paid",
    provider: "manual",
    createdAt: minutes(-5),
    updatedAt: minutes(-5)
  });

  const consumedReservation2 = await (Reservation as any).create({
    id: crypto.randomUUID(),
    userId: charlie.id,
    dropId: dropA.id,
    status: "CONSUMED",
    expiresAt: minutes(5)
  });
  await (Purchase as any).create({
    id: crypto.randomUUID(),
    userId: charlie.id,
    dropId: dropA.id,
    reservationId: consumedReservation2.id,
    qty: 1,
    amountCents: 5000,
    currency: "USD",
    status: "paid",
    provider: "manual",
    createdAt: minutes(-2),
    updatedAt: minutes(-2)
  });

  // Expiry demo: Drop C has 1 ACTIVE reservation already expired (availableStock=3 means 1 held)
  const expiredReservation = await (Reservation as any).create({
    id: crypto.randomUUID(),
    userId: alice.id,
    dropId: dropC.id,
    status: "ACTIVE",
    expiresAt: minutes(-1)
  });

  logger.info(
    {
      users: [admin, alice, bob, charlie],
      drops: [
        { id: dropA.id, name: "Air Jordan 1 (Seed)" },
        { id: dropB.id, name: "Yeezy (Scheduled Seed)" },
        { id: dropC.id, name: "Dunk Low (Expiry Demo Seed)" }
      ],
      reservations: [
        { id: activeReservationA.id, dropId: dropA.id, status: "ACTIVE" },
        { id: expiredReservation.id, dropId: dropC.id, status: "ACTIVE (expired)" }
      ]
    },
    "Seed complete"
  );

  await sequelize.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

